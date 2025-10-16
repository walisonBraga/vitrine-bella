export interface MenuItem {
  icon: string;
  label: string;
  route?: string;
  permission?: string; // Permissão necessária para mostrar o item
}
