import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';

@Component({
  selector: 'app-icon-selector',
  templateUrl: './icon-selector.component.html',
  styleUrls: ['./icon-selector.component.scss']
})
export class IconSelectorComponent implements OnInit {
  @Input() selectedIcon: string = 'category';
  @Output() iconSelected = new EventEmitter<string>();

  // Lista de ícones organizados por categoria
  iconCategories = [
    {
      name: 'Geral',
      icons: [
        'category', 'folder', 'folder_open', 'label', 'bookmark', 'tag', 'local_offer',
        'star', 'star_border', 'favorite', 'favorite_border', 'bookmark_border'
      ]
    },
    {
      name: 'Comércio',
      icons: [
        'store', 'shopping_cart', 'shopping_bag', 'point_of_sale', 'payment', 'credit_card',
        'receipt', 'local_grocery_store', 'storefront', 'shopping_basket', 'local_mall'
      ]
    },
    {
      name: 'Eletrônicos',
      icons: [
        'phone', 'smartphone', 'laptop', 'computer', 'tablet', 'headphones', 'speaker',
        'tv', 'camera_alt', 'videocam', 'radio', 'watch', 'memory', 'router'
      ]
    },
    {
      name: 'Casa & Decoração',
      icons: [
        'home', 'chair', 'bed', 'table_restaurant', 'kitchen', 'bathtub', 'shower',
        'couch', 'dining', 'single_bed', 'king_bed', 'sofa', 'table_bar'
      ]
    },
    {
      name: 'Roupas & Acessórios',
      icons: [
        'checkroom', 'face', 'self_care', 'dry_cleaning', 'local_laundry_service',
        'shoe', 'watch', 'sunglasses', 'bag', 'backpack', 'umbrella'
      ]
    },
    {
      name: 'Esportes & Lazer',
      icons: [
        'sports_soccer', 'sports_basketball', 'sports_tennis', 'sports_golf', 'sports_baseball',
        'fitness_center', 'pool', 'bike', 'directions_run', 'sports_volleyball', 'sports_hockey'
      ]
    },
    {
      name: 'Livros & Mídia',
      icons: [
        'book', 'library_books', 'menu_book', 'auto_stories', 'newspaper', 'movie',
        'music_note', 'headset', 'games', 'casino', 'sports_esports'
      ]
    },
    {
      name: 'Automóveis',
      icons: [
        'directions_car', 'motorcycle', 'pedal_bike', 'scooter', 'train', 'flight',
        'directions_bus', 'boat', 'truck', 'garage', 'car_repair'
      ]
    },
    {
      name: 'Saúde & Beleza',
      icons: [
        'health_and_safety', 'local_hospital', 'medication', 'healing', 'favorite',
        'face_retouching_natural', 'spa', 'self_care', 'sanitizer', 'vaccines'
      ]
    },
    {
      name: 'Alimentos & Bebidas',
      icons: [
        'restaurant', 'local_pizza', 'cake', 'coffee', 'wine_bar', 'local_drink',
        'fastfood', 'dining', 'room_service', 'takeout_dining', 'bakery_dining'
      ]
    },
    {
      name: 'Ferramentas & Construção',
      icons: [
        'build', 'construction', 'handyman', 'engineering', 'precision_manufacturing',
        'home_repair_service', 'plumbing', 'electrical_services', 'carpenter'
      ]
    },
    {
      name: 'Jardinagem',
      icons: [
        'park', 'grass', 'local_florist', 'eco', 'nature', 'forest', 'pets',
        'yard', 'plant', 'agriculture', 'landscape'
      ]
    }
  ];

  filteredCategories: any[] = [];
  searchTerm: string = '';

  ngOnInit(): void {
    this.filteredCategories = this.iconCategories;
  }

  onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm = target.value.toLowerCase();
    this.filterIcons();
  }

  filterIcons(): void {
    if (!this.searchTerm.trim()) {
      this.filteredCategories = this.iconCategories;
      return;
    }

    this.filteredCategories = this.iconCategories.map(category => ({
      ...category,
      icons: category.icons.filter(icon =>
        icon.toLowerCase().includes(this.searchTerm) ||
        this.getIconDescription(icon).toLowerCase().includes(this.searchTerm)
      )
    })).filter(category => category.icons.length > 0);
  }

  selectIcon(icon: string): void {
    this.selectedIcon = icon;
    this.iconSelected.emit(icon);
  }


  public getIconDescription(icon: string): string {
    const descriptions: { [key: string]: string } = {
      'category': 'Categoria',
      'folder': 'Pasta',
      'folder_open': 'Pasta Aberta',
      'label': 'Etiqueta',
      'bookmark': 'Marcador',
      'tag': 'Tag',
      'local_offer': 'Oferta',
      'star': 'Estrela',
      'favorite': 'Favorito',
      'store': 'Loja',
      'shopping_cart': 'Carrinho de Compras',
      'shopping_bag': 'Sacola de Compras',
      'phone': 'Telefone',
      'smartphone': 'Smartphone',
      'laptop': 'Laptop',
      'computer': 'Computador',
      'home': 'Casa',
      'chair': 'Cadeira',
      'bed': 'Cama',
      'checkroom': 'Vestuário',
      'sports_soccer': 'Futebol',
      'sports_basketball': 'Basquete',
      'book': 'Livro',
      'directions_car': 'Carro',
      'restaurant': 'Restaurante',
      'build': 'Ferramentas',
      'park': 'Jardim'
    };
    return descriptions[icon] || icon;
  }
}
