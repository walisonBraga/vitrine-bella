import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProductService } from '../../../service/product.service';
import { Product } from '../../../interface/products';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Storage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from '@angular/fire/storage';


import { Subscription } from 'rxjs';
import { Category } from '../../../../categories/interface/category';
import { CategoryService } from '../../../../categories/service/category.service';

@Component({
  selector: 'app-product-registration-modal',
  templateUrl: './product-registration-modal.component.html',
  styleUrl: './product-registration-modal.component.scss'
})
export class ProductRegistrationModalComponent implements OnInit, OnDestroy {
  productForm!: FormGroup;
  loading = false;
  title: string;
  selectedImageUrl: string | null = null;
  selectedFile: File | null = null;
  imageUrl: string | null = null;
  categories: Category[] = [];
  private categoriesSubscription: Subscription | undefined;

  // Múltiplas imagens
  additionalImages: File[] = [];
  additionalImageUrls: string[] = [];
  additionalImagePreviews: string[] = [];
  imagesToDelete: string[] = []; // URLs das imagens que serão removidas
  originalProductName: string = ''; // Nome original para detectar mudanças

  // Informações técnicas
  showTechnicalInfo = false;
  selectedCategoryFields: string[] = []; // Campos específicos da categoria selecionada

  // Garantia Estendida
  showExtendedWarranty = false;
  warranty12Active = false;
  warranty24Active = false;
  warranty36Active = false;
  warrantyOptions: any[] = [
    { months: 12, price: 76.80, description: '12 Meses de Garantia Estendida Vitrine Bella', installmentPrice: 7.68, installmentMonths: 10 },
    { months: 24, price: 153.60, description: '24 Meses de Garantia Estendida Vitrine Bella', installmentPrice: 15.36, installmentMonths: 10 },
    { months: 36, price: 230.40, description: '36 Meses de Garantia Estendida Vitrine Bella', installmentPrice: 23.04, installmentMonths: 10 }
  ];

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ProductRegistrationModalComponent>,
    private productService: ProductService,
    private categoryService: CategoryService,
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
      category: ['', Validators.required],
      // Informações técnicas
      brand: [''],
      model: [''],
      composition: [''],
      size: [''],
      weight: [''],
      warranty: [''],
      manufacturer: [''],
      careInstructions: [''],
      packageContents: [''],
      // Campos específicos por categoria
      processor: [''],
      ram: [''],
      storage: [''],
      screenSize: [''],
      resolution: [''],
      operatingSystem: [''],
      battery: [''],
      connectivity: [''],
      camera: [''],
      color: [''],
      material: [''],
      dimensions: [''],
      powerConsumption: [''],
      frequency: [''],
      channels: [''],
      audioFormat: [''],
      videoFormat: [''],
      ports: [''],
      accessories: [''],
      // Garantia Estendida
      extendedWarrantyAvailable: [false],
      warranty12Months: [76.80],
      warranty24Months: [153.60],
      warranty36Months: [230.40],
      warranty12Description: ['12 Meses de Garantia Estendida Vitrine Bella'],
      warranty24Description: ['24 Meses de Garantia Estendida Vitrine Bella'],
      warranty36Description: ['36 Meses de Garantia Estendida Vitrine Bella'],
      warranty12Installment: [7.68],
      warranty24Installment: [15.36],
      warranty36Installment: [23.04]
    });

    // Carregar categorias ativas
    this.loadCategories();

    if (this.data.mode === 'edit' && this.data.product) {
      this.productForm.patchValue(this.data.product);
      this.originalProductName = this.data.product.productName; // Salvar nome original

      if (this.data.product.imageUrl) {
        this.imageUrl = this.data.product.imageUrl;
        this.selectedImageUrl = this.data.product.imageUrl;
      }

      // Carregar imagens adicionais
      if (this.data.product.images && this.data.product.images.length > 0) {
        this.additionalImageUrls = [...this.data.product.images];
        this.additionalImagePreviews = [...this.data.product.images];
      }

      // Carregar informações técnicas
      if (this.data.product.technicalInfo) {
        this.productForm.patchValue({
          brand: this.data.product.technicalInfo.brand || '',
          model: this.data.product.technicalInfo.model || '',
          composition: this.data.product.technicalInfo.composition || '',
          size: this.data.product.technicalInfo.size || '',
          weight: this.data.product.technicalInfo.weight || '',
          warranty: this.data.product.technicalInfo.warranty || '',
          manufacturer: this.data.product.technicalInfo.manufacturer || '',
          careInstructions: this.data.product.technicalInfo.careInstructions?.join('\n') || '',
          packageContents: this.data.product.technicalInfo.packageContents?.join('\n') || '',
          // Campos específicos por categoria
          processor: this.data.product.technicalInfo.processor || '',
          ram: this.data.product.technicalInfo.ram || '',
          storage: this.data.product.technicalInfo.storage || '',
          screenSize: this.data.product.technicalInfo.screenSize || '',
          resolution: this.data.product.technicalInfo.resolution || '',
          operatingSystem: this.data.product.technicalInfo.operatingSystem || '',
          battery: this.data.product.technicalInfo.battery || '',
          connectivity: this.data.product.technicalInfo.connectivity || '',
          camera: this.data.product.technicalInfo.camera || '',
          color: this.data.product.technicalInfo.color || '',
          material: this.data.product.technicalInfo.material || '',
          dimensions: this.data.product.technicalInfo.dimensions || '',
          powerConsumption: this.data.product.technicalInfo.powerConsumption || '',
          frequency: this.data.product.technicalInfo.frequency || '',
          channels: this.data.product.technicalInfo.channels || '',
          audioFormat: this.data.product.technicalInfo.audioFormat || '',
          videoFormat: this.data.product.technicalInfo.videoFormat || '',
          ports: this.data.product.technicalInfo.ports || '',
          accessories: this.data.product.technicalInfo.accessories || ''
        });
        this.showTechnicalInfo = true;
        // Definir campos específicos da categoria
        this.selectedCategoryFields = this.getCategoryFields(this.data.product.category);
      }
    }
  }

  onImageSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        this.snackBar.open('Por favor, selecione apenas arquivos de imagem', 'Fechar', {
          duration: 3000
        });
        event.target.value = '';
        return;
      }

      // Validar tamanho (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.snackBar.open('A imagem deve ter no máximo 5MB', 'Fechar', {
          duration: 3000
        });
        event.target.value = '';
        return;
      }

      // Salvar arquivo selecionado
      this.selectedFile = file;

      // Criar preview da imagem
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.selectedImageUrl = e.target.result as string;
      };
      reader.readAsDataURL(file);

      this.snackBar.open('Imagem selecionada. Clique em "Criar Produto" para confirmar.', 'Fechar', {
        duration: 3000
      });
    }
  }

  removeImage(): void {
    // Se é uma imagem existente (não nova), marcar para exclusão
    if (this.imageUrl && !this.selectedFile) {
      this.imagesToDelete.push(this.imageUrl);
    }

    this.selectedFile = null;
    this.selectedImageUrl = null;
    this.imageUrl = null;

    this.snackBar.open('Imagem removida', 'Fechar', {
      duration: 2000
    });
  }

  // Métodos para múltiplas imagens
  onAdditionalImagesSelected(event: any): void {
    const files = Array.from(event.target.files) as File[];

    files.forEach(file => {
      if (file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024) {
        this.additionalImages.push(file);

        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.additionalImagePreviews.push(e.target.result);
        };
        reader.readAsDataURL(file);
      }
    });

    if (files.length > 0) {
      this.snackBar.open(`${files.length} imagem(ns) adicionada(s)`, 'Fechar', {
        duration: 3000
      });
    }

    event.target.value = '';
  }

  removeAdditionalImage(index: number): void {
    // Se é uma imagem existente (não nova), marcar para exclusão
    if (index < this.additionalImageUrls.length) {
      this.imagesToDelete.push(this.additionalImageUrls[index]);
    }

    // Remover das listas locais
    this.additionalImageUrls.splice(index, 1);
    this.additionalImagePreviews.splice(index, 1);

    // Se é uma imagem nova (arquivo), remover do array de arquivos
    const fileIndex = index - (this.additionalImageUrls.length - this.additionalImages.length);
    if (fileIndex >= 0 && fileIndex < this.additionalImages.length) {
      this.additionalImages.splice(fileIndex, 1);
    }

    this.snackBar.open('Imagem removida', 'Fechar', {
      duration: 2000
    });
  }

  toggleTechnicalInfo(): void {
    this.showTechnicalInfo = !this.showTechnicalInfo;
  }

  onCategoryChange(categoryName: string): void {
    this.selectedCategoryFields = this.getCategoryFields(categoryName);
  }

  getCategoryFields(categoryName: string): string[] {
    const categoryLower = categoryName.toLowerCase();

    if (categoryLower.includes('computador') || categoryLower.includes('pc') || categoryLower.includes('notebook')) {
      return ['processor', 'ram', 'storage', 'screenSize', 'resolution', 'operatingSystem', 'ports'];
    } else if (categoryLower.includes('telefone') || categoryLower.includes('celular') || categoryLower.includes('smartphone')) {
      return ['screenSize', 'resolution', 'operatingSystem', 'battery', 'connectivity', 'camera', 'storage'];
    } else if (categoryLower.includes('televisão') || categoryLower.includes('tv') || categoryLower.includes('smart tv')) {
      return ['screenSize', 'resolution', 'connectivity', 'audioFormat', 'videoFormat', 'ports', 'powerConsumption'];
    } else if (categoryLower.includes('som') || categoryLower.includes('audio') || categoryLower.includes('caixa')) {
      return ['frequency', 'channels', 'audioFormat', 'connectivity', 'powerConsumption', 'dimensions'];
    } else if (categoryLower.includes('roupa') || categoryLower.includes('vestuário') || categoryLower.includes('moda')) {
      return ['size', 'color', 'material', 'composition', 'careInstructions'];
    } else if (categoryLower.includes('casa') || categoryLower.includes('decoração') || categoryLower.includes('móvel')) {
      return ['dimensions', 'material', 'color', 'weight', 'careInstructions'];
    } else {
      return ['size', 'weight', 'color', 'material', 'dimensions'];
    }
  }

  // Métodos para gerenciar imagens no Firebase Storage
  async deleteImageFromStorage(imageUrl: string): Promise<void> {
    try {
      const imageRef = ref(this.storage, imageUrl);
      await deleteObject(imageRef);
    } catch (error) {
      console.error('Erro ao excluir imagem do storage:', error);
      // Não lançar erro para não interromper o processo
    }
  }

  async deleteImagesFromStorage(imageUrls: string[]): Promise<void> {
    const deletePromises = imageUrls.map(url => this.deleteImageFromStorage(url));
    await Promise.all(deletePromises);
  }

  async renameImageInStorage(oldUrl: string, newName: string): Promise<string | null> {
    try {
      // Baixar a imagem antiga
      const response = await fetch(oldUrl);
      const blob = await response.blob();

      // Criar nova referência com o novo nome
      const newRef = ref(this.storage, `products/${newName}`);

      // Fazer upload da imagem com o novo nome
      const uploadTask = uploadBytesResumable(newRef, blob);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            // Progress tracking
          },
          (error) => {
            reject(error);
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              // Excluir a imagem antiga
              await this.deleteImageFromStorage(oldUrl);
              resolve(downloadURL);
            } catch (error) {
              reject(error);
            }
          }
        );
      });
    } catch (error) {
      console.error('Erro ao renomear imagem:', error);
      return null;
    }
  }

  async renameImagesForProduct(productName: string): Promise<string[]> {
    const sanitizedName = productName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase();
    const renamedUrls: string[] = [];

    for (let i = 0; i < this.additionalImageUrls.length; i++) {
      const oldUrl = this.additionalImageUrls[i];
      const extension = oldUrl.split('.').pop() || 'jpg';
      const newName = `${sanitizedName}_${i + 1}.${extension}`;

      const newUrl = await this.renameImageInStorage(oldUrl, newName);
      if (newUrl) {
        renamedUrls.push(newUrl);
      } else {
        renamedUrls.push(oldUrl); // Manter URL original se falhar
      }
    }

    return renamedUrls;
  }

  async uploadAdditionalImages(productName: string): Promise<string[]> {
    const uploadedUrls: string[] = [];

    for (let i = 0; i < this.additionalImages.length; i++) {
      const file = this.additionalImages[i];
      const sanitizedName = productName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase();
      const extension = file.name.split('.').pop() || 'jpg';
      const fileName = `${sanitizedName}_additional_${i + 1}.${extension}`;
      const filePath = `products/${fileName}`;
      const storageRef = ref(this.storage, filePath);
      const uploadTask = uploadBytesResumable(storageRef, file);

      try {
        const downloadURL = await new Promise<string>((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              // Progress tracking if needed
            },
            (error) => {
              reject(error);
            },
            async () => {
              try {
                const url = await getDownloadURL(uploadTask.snapshot.ref);
                resolve(url);
              } catch (error) {
                reject(error);
              }
            }
          );
        });

        uploadedUrls.push(downloadURL);
      } catch (error) {
        console.error('Error uploading additional image:', error);
        throw error;
      }
    }

    return uploadedUrls;
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

      // Se o nome do produto mudou e há imagem principal existente, renomear
      if (this.data.mode === 'edit' && productData.productName !== this.originalProductName && this.imageUrl && !this.selectedFile) {
        const sanitizedName = productData.productName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase();
        const extension = this.imageUrl.split('.').pop() || 'jpg';
        const newName = `${sanitizedName}.${extension}`;
        imageUrl = await this.renameImageInStorage(this.imageUrl, newName);
      }

      if (this.selectedFile) {
        imageUrl = await this.uploadImage(productData.productName);
        if (!imageUrl) {
          throw new Error('Falha no upload da imagem');
        }
      } else if (!imageUrl && this.data.mode === 'create') {
        throw new Error('Imagem é obrigatória para cadastro');
      }

      // Gerenciar imagens existentes e novas
      let additionalImageUrls = [...this.additionalImageUrls];

      // Se o nome do produto mudou, renomear imagens existentes
      if (this.data.mode === 'edit' && productData.productName !== this.originalProductName) {
        additionalImageUrls = await this.renameImagesForProduct(productData.productName);
      }

      // Upload das novas imagens adicionais
      if (this.additionalImages.length > 0) {
        const uploadedUrls = await this.uploadAdditionalImages(productData.productName);
        additionalImageUrls = [...additionalImageUrls, ...uploadedUrls];
      }

      // Excluir imagens marcadas para exclusão
      if (this.imagesToDelete.length > 0) {
        await this.deleteImagesFromStorage(this.imagesToDelete);
      }

      // Preparar informações técnicas
      const technicalInfo = this.showTechnicalInfo ? this.buildTechnicalInfo(productData) : undefined;

      // Preparar garantia estendida
      const extendedWarranty = this.buildExtendedWarranty();

      const product: Product = {
        ...productData,
        imageUrl: imageUrl ?? null,
        images: additionalImageUrls.length > 0 ? additionalImageUrls : undefined,
        technicalInfo: technicalInfo,
        extendedWarranty: extendedWarranty,
        isActive: true,
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

      // Limpar arquivos selecionados e previews
      this.selectedFile = null;
      this.selectedImageUrl = null;
      this.additionalImages = [];
      this.additionalImagePreviews = [];
      this.additionalImageUrls = [];
      this.imagesToDelete = [];
      this.originalProductName = '';

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

  // Método para construir informações técnicas sem campos undefined
  private buildTechnicalInfo(productData: any): any {
    const technicalInfo: any = {};

    // Campos básicos
    if (productData.brand?.trim()) technicalInfo.brand = productData.brand.trim();
    if (productData.model?.trim()) technicalInfo.model = productData.model.trim();
    if (productData.composition?.trim()) technicalInfo.composition = productData.composition.trim();
    if (productData.size?.trim()) technicalInfo.size = productData.size.trim();
    if (productData.weight?.trim()) technicalInfo.weight = productData.weight.trim();
    if (productData.warranty?.trim()) technicalInfo.warranty = productData.warranty.trim();
    if (productData.manufacturer?.trim()) technicalInfo.manufacturer = productData.manufacturer.trim();
    if (productData.color?.trim()) technicalInfo.color = productData.color.trim();
    if (productData.material?.trim()) technicalInfo.material = productData.material.trim();
    if (productData.dimensions?.trim()) technicalInfo.dimensions = productData.dimensions.trim();

    // Instruções de cuidado
    if (productData.careInstructions?.trim()) {
      const instructions = productData.careInstructions.split('\n')
        .filter((line: string) => line.trim())
        .map((line: string) => line.trim());
      if (instructions.length > 0) {
        technicalInfo.careInstructions = instructions;
      }
    }

    // Conteúdo da embalagem
    if (productData.packageContents?.trim()) {
      const contents = productData.packageContents.split('\n')
        .filter((line: string) => line.trim())
        .map((line: string) => line.trim());
      if (contents.length > 0) {
        technicalInfo.packageContents = contents;
      }
    }

    // Campos específicos por categoria
    if (productData.processor?.trim()) technicalInfo.processor = productData.processor.trim();
    if (productData.ram?.trim()) technicalInfo.ram = productData.ram.trim();
    if (productData.storage?.trim()) technicalInfo.storage = productData.storage.trim();
    if (productData.screenSize?.trim()) technicalInfo.screenSize = productData.screenSize.trim();
    if (productData.resolution?.trim()) technicalInfo.resolution = productData.resolution.trim();
    if (productData.operatingSystem?.trim()) technicalInfo.operatingSystem = productData.operatingSystem.trim();
    if (productData.battery?.trim()) technicalInfo.battery = productData.battery.trim();
    if (productData.connectivity?.trim()) technicalInfo.connectivity = productData.connectivity.trim();
    if (productData.camera?.trim()) technicalInfo.camera = productData.camera.trim();
    if (productData.color?.trim()) technicalInfo.color = productData.color.trim();
    if (productData.material?.trim()) technicalInfo.material = productData.material.trim();
    if (productData.dimensions?.trim()) technicalInfo.dimensions = productData.dimensions.trim();
    if (productData.powerConsumption?.trim()) technicalInfo.powerConsumption = productData.powerConsumption.trim();
    if (productData.frequency?.trim()) technicalInfo.frequency = productData.frequency.trim();
    if (productData.channels?.trim()) technicalInfo.channels = productData.channels.trim();
    if (productData.audioFormat?.trim()) technicalInfo.audioFormat = productData.audioFormat.trim();
    if (productData.videoFormat?.trim()) technicalInfo.videoFormat = productData.videoFormat.trim();
    if (productData.ports?.trim()) technicalInfo.ports = productData.ports.trim();
    if (productData.accessories?.trim()) technicalInfo.accessories = productData.accessories.trim();

    // Retorna o objeto apenas se tiver pelo menos um campo
    return Object.keys(technicalInfo).length > 0 ? technicalInfo : undefined;
  }

  private loadCategories(): void {
    this.categoriesSubscription = this.categoryService.getActiveCategories().subscribe({
      next: (categories: Category[]) => {
        this.categories = categories;
      },
      error: (error: any) => {
        console.error('Erro ao carregar categorias:', error);
        this.snackBar.open('Erro ao carregar categorias', 'Fechar', { duration: 3000 });
      }
    });
  }

  ngOnDestroy(): void {
    if (this.categoriesSubscription) {
      this.categoriesSubscription.unsubscribe();
    }
  }

  // Métodos para Garantia Estendida
  toggleExtendedWarranty(): void {
    this.showExtendedWarranty = !this.showExtendedWarranty;
  }

  // Controlar ativação das garantias
  toggleWarranty12(checked: boolean): void {
    this.warranty12Active = checked;
    if (checked) {
      // Se ativar, usar valor padrão se não tiver valor
      const currentValue = this.productForm.get('warranty12Months')?.value;
      if (!currentValue || currentValue === 0) {
        this.productForm.get('warranty12Months')?.setValue(76.80);
        this.productForm.get('warranty12Installment')?.setValue(7.68);
      }
    } else {
      // Se desativar, zerar valores
      this.productForm.get('warranty12Months')?.setValue(0);
      this.productForm.get('warranty12Installment')?.setValue(0);
    }
  }

  toggleWarranty24(checked: boolean): void {
    this.warranty24Active = checked;
    if (checked) {
      const currentValue = this.productForm.get('warranty24Months')?.value;
      if (!currentValue || currentValue === 0) {
        this.productForm.get('warranty24Months')?.setValue(153.60);
        this.productForm.get('warranty24Installment')?.setValue(15.36);
      }
    } else {
      this.productForm.get('warranty24Months')?.setValue(0);
      this.productForm.get('warranty24Installment')?.setValue(0);
    }
  }

  toggleWarranty36(checked: boolean): void {
    this.warranty36Active = checked;
    if (checked) {
      const currentValue = this.productForm.get('warranty36Months')?.value;
      if (!currentValue || currentValue === 0) {
        this.productForm.get('warranty36Months')?.setValue(230.40);
        this.productForm.get('warranty36Installment')?.setValue(23.04);
      }
    } else {
      this.productForm.get('warranty36Months')?.setValue(0);
      this.productForm.get('warranty36Installment')?.setValue(0);
    }
  }

  // Calcular parcelamento automaticamente
  calculateInstallment(warrantyType: string, price: number): void {
    if (price > 0) {
      const installmentValue = price / 12; // Dividir por 12x
      const installmentField = `warranty${warrantyType}Installment`;
      this.productForm.get(installmentField)?.setValue(installmentValue);
    }
  }

  // Métodos específicos para cada tipo de garantia
  onWarranty12PriceChange(event: any): void {
    const price = parseFloat(event.target.value) || 0;
    this.calculateInstallment('12', price);
  }

  onWarranty24PriceChange(event: any): void {
    const price = parseFloat(event.target.value) || 0;
    this.calculateInstallment('24', price);
  }

  onWarranty36PriceChange(event: any): void {
    const price = parseFloat(event.target.value) || 0;
    this.calculateInstallment('36', price);
  }

  updateWarrantyOption(index: number, field: string, value: any): void {
    this.warrantyOptions[index][field] = value;

    // Atualizar campos do formulário
    const formField = `warranty${this.warrantyOptions[index].months}Months`;
    if (field === 'price') {
      this.productForm.get(formField)?.setValue(value);
    } else if (field === 'description') {
      this.productForm.get(`warranty${this.warrantyOptions[index].months}Description`)?.setValue(value);
    } else if (field === 'installmentPrice') {
      this.productForm.get(`warranty${this.warrantyOptions[index].months}Installment`)?.setValue(value);
    }
  }

  buildExtendedWarranty(): any {
    const formData = this.productForm.value;

    if (!formData.extendedWarrantyAvailable) {
      return undefined;
    }

    const options = [];

    // 12 meses - só adiciona se tiver preço > 0
    if (formData.warranty12Months > 0) {
      options.push({
        months: 12,
        price: formData.warranty12Months,
        description: formData.warranty12Description?.trim() || `${formData.warranty12Months} Meses de Garantia Estendida Vitrine Bella`,
        installmentPrice: formData.warranty12Installment || (formData.warranty12Months / 10),
        installmentMonths: 10
      });
    }

    // 24 meses - só adiciona se tiver preço > 0
    if (formData.warranty24Months > 0) {
      options.push({
        months: 24,
        price: formData.warranty24Months,
        description: formData.warranty24Description?.trim() || `${formData.warranty24Months} Meses de Garantia Estendida Vitrine Bella`,
        installmentPrice: formData.warranty24Installment || (formData.warranty24Months / 10),
        installmentMonths: 10
      });
    }

    // 36 meses - só adiciona se tiver preço > 0
    if (formData.warranty36Months > 0) {
      options.push({
        months: 36,
        price: formData.warranty36Months,
        description: formData.warranty36Description?.trim() || `${formData.warranty36Months} Meses de Garantia Estendida Vitrine Bella`,
        installmentPrice: formData.warranty36Installment || (formData.warranty36Months / 10),
        installmentMonths: 10
      });
    }

    // Só retorna se tiver pelo menos uma opção válida
    if (options.length === 0) {
      return undefined;
    }

    return {
      isAvailable: formData.extendedWarrantyAvailable,
      options: options
    };
  }
}
