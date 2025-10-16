import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FavoritosService {
  private favoritosSubject = new BehaviorSubject<string[]>([]);
  public favoritos$ = this.favoritosSubject.asObservable();

  constructor() {
    this.loadFavoritos();
  }

  private loadFavoritos(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      const favoritosSalvos = localStorage.getItem('favoritos');
      const favoritos = favoritosSalvos ? JSON.parse(favoritosSalvos) : [];
      this.favoritosSubject.next(favoritos);
    }
  }

  private saveFavoritos(favoritos: string[]): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('favoritos', JSON.stringify(favoritos));
      this.favoritosSubject.next(favoritos);
    }
  }

  getFavoritos(): string[] {
    return this.favoritosSubject.value;
  }

  toggleFavorito(produtoId: string): void {
    const favoritos = this.getFavoritos();
    const index = favoritos.indexOf(produtoId);

    if (index > -1) {
      // Remove dos favoritos
      favoritos.splice(index, 1);
    } else {
      // Adiciona aos favoritos
      favoritos.push(produtoId);
    }

    this.saveFavoritos(favoritos);
  }

  isFavorito(produtoId: string): boolean {
    return this.getFavoritos().includes(produtoId);
  }

  getFavoritosCount(): number {
    return this.getFavoritos().length;
  }

  getFavoritosCount$(): Observable<number> {
    return new Observable(observer => {
      this.favoritos$.subscribe(favoritos => {
        observer.next(favoritos.length);
      });
    });
  }
}
