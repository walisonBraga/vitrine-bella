import { Component, Input, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-avatar',
  templateUrl: './avatar.component.html',
  styleUrl: './avatar.component.scss'
})
export class AvatarComponent implements OnInit, OnChanges {
  @Input() name: string = '';
  @Input() photoUrl: string | null | undefined = null;
  @Input() size: number = 40;
  @Input() showBorder: boolean = false;
  @Input() backgroundColor: string = '#007bff';

  displayName: string = '';
  avatarUrl: string | null = null;

  ngOnInit(): void {
    this.processAvatar();
  }

  ngOnChanges(): void {
    this.processAvatar();
  }

  private processAvatar(): void {
    // Processar nome para exibição
    this.displayName = this.name ? this.name.charAt(0).toUpperCase() : 'U';

    // Determinar URL do avatar
    if (this.photoUrl && this.photoUrl.trim() !== '') {
      this.avatarUrl = this.photoUrl;
    } else if (this.name && this.name.trim() !== '') {
      // Gerar avatar automático usando UI-Avatars
      this.avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(this.name)}&background=${this.backgroundColor.replace('#', '')}&color=fff&size=${this.size}`;
    } else {
      this.avatarUrl = null;
    }
  }

  onImageError(): void {
    this.avatarUrl = null;
  }

  get avatarStyles(): any {
    return {
      width: `${this.size}px`,
      height: `${this.size}px`,
      backgroundColor: this.backgroundColor,
      border: this.showBorder ? '2px solid #e0e0e0' : 'none'
    };
  }
}
