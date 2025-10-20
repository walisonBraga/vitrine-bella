import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class RoleTranslationService {

  private roleTranslations: Record<string, string> = {
    'admin': 'Administrador',
    'store_owner': 'Proprietário da Loja',
    'store_manager': 'Gerente da Loja',
    'store_employee': 'Funcionário da Loja',
    'cliente': 'Cliente',
    'loja': 'Cliente'
  };

  /**
   * Converte uma role em inglês para português
   */
  translateRole(role: string): string {
    return this.roleTranslations[role] || role;
  }

  /**
   * Converte uma role em português para inglês
   */
  translateRoleToEnglish(rolePt: string): string {
    const reverseMap: Record<string, string> = {};
    Object.entries(this.roleTranslations).forEach(([en, pt]) => {
      reverseMap[pt] = en;
    });
    return reverseMap[rolePt] || rolePt;
  }

  /**
   * Retorna todas as traduções disponíveis
   */
  getAllTranslations(): Record<string, string> {
    return { ...this.roleTranslations };
  }

  /**
   * Retorna as opções de roles traduzidas para uso em selects
   */
  getRoleOptions(): Array<{value: string, label: string}> {
    return Object.entries(this.roleTranslations).map(([value, label]) => ({
      value,
      label
    }));
  }
}
