import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProductService } from '../../../service/product.service';
import { Product } from '../../../interface/products';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Storage, ref, uploadBytesResumable, getDownloadURL } from '@angular/fire/storage';

@Component({
  selector: 'app-product-registration-modal',
  templateUrl: './product-registration-modal.component.html',
  styleUrl: './product-registration-modal.component.scss'
})
export class ProductRegistrationModalComponent implements OnInit {
  productForm!: FormGroup;
  loading = false;
  title: string;
  selectedImageUrl: string | null = null;
  selectedFile: File | null = null;
  imageUrl: string | null = null;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ProductRegistrationModalComponent>,
    private productService: ProductService,
    private snackBar: MatSnackBar,
    private storage: Storage,
    @Inject(MAT_DIALOG_DATA) public data: { mode: 'create' | 'edit'; id?: string; product?: Product }
  ) {
    this.title = data.mode === 'create' ? 'Cadastrar Novo Produto' : 'Editar Produto';
  }

  ngOnInit(): void {
    this.productForm = this.fb.group({
      productName: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.maxLength(500)]],
      price: ['', [Validators.required, Validators.min(0.01)]],
      stock: ['', [Validators.required, Validators.min(0)]],
      category: ['', Validators.required]
      // Removed 'image' field from form
    });

    if (this.data.mode === 'edit' && this.data.product) {
      this.productForm.patchValue(this.data.product);
      if (this.data.product.imageUrl) {
        this.imageUrl = this.data.product.imageUrl;
        this.selectedImageUrl = this.data.product.imageUrl; // Preload existing image URL
      }
    }
  }

  onImageSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      if (file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024) { // 5MB limit
        this.selectedFile = file;
        // No need to set form value for 'image' since it's not in the form

        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.selectedImageUrl = e.target.result as string;
        };
        reader.readAsDataURL(file);
      } else {
        this.snackBar.open('Selecione uma imagem válida (JPG/PNG, máx. 5MB)', 'Fechar', { duration: 3000 });
        event.target.value = '';
        this.selectedFile = null;
      }
    }
  }

  removeImage(): void {
    this.selectedFile = null;
    this.selectedImageUrl = null;
    this.imageUrl = null; // Clear existing URL if removing
  }

  async uploadImage(productName: string): Promise<string | null> {
    if (!this.selectedFile) return null;

    const sanitizedName = productName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase();
    const extension = this.selectedFile.name.split('.').pop() || 'jpg';
    const fileName = `${sanitizedName}.${extension}`;
    const filePath = `products/${fileName}`;
    const storageRef = ref(this.storage, filePath);
    const uploadTask = uploadBytesResumable(storageRef, this.selectedFile);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        },
        (error) => {
          console.error('Upload failed:', error);
          this.snackBar.open('Erro ao fazer upload da imagem', 'Fechar', { duration: 3000 });
          reject(error);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          } catch (error) {
            console.error('Error getting download URL:', error);
            this.snackBar.open('Erro ao obter URL da imagem', 'Fechar', { duration: 3000 });
            reject(error);
          }
        }
      );
    });
  }

  async onSubmit(): Promise<void> {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    const productData = this.productForm.value;

    try {
      let imageUrl = this.imageUrl;
      if (this.selectedFile) {
        imageUrl = await this.uploadImage(productData.productName);
        if (!imageUrl) {
          throw new Error('Falha no upload da imagem');
        }
      } else if (!imageUrl && this.data.mode === 'create') {
        throw new Error('Imagem é obrigatória para cadastro');
      }

      const product: Product = {
        ...productData,
        imageUrl: imageUrl ?? null,
        isActive: true, // Default to active for new products
        createdAt: this.data.mode === 'create' ? new Date().toISOString() : undefined,
        updatedAt: new Date().toISOString()
      };

      if (this.data.mode === 'create') {
        await this.productService.createProduct(product);
        this.snackBar.open('Produto cadastrado com sucesso!', 'Fechar', { duration: 3000 });
      } else if (this.data.mode === 'edit' && this.data.id) {
        await this.productService.updateProduct(this.data.id, product);
        this.snackBar.open('Produto atualizado com sucesso!', 'Fechar', { duration: 3000 });
      }

      this.dialogRef.close(true);
    } catch (error: any) {
      this.snackBar.open('Erro ao salvar produto: ' + error.message, 'Fechar', { duration: 3000 });
    } finally {
      this.loading = false;
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
