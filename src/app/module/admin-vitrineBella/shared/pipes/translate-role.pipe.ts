import { Pipe, PipeTransform } from '@angular/core';
import { RoleTranslationService } from '../services/role-translation.service';

@Pipe({
  name: 'translateRole',
  standalone: true
})
export class TranslateRolePipe implements PipeTransform {

  constructor(private roleTranslationService: RoleTranslationService) {}

  transform(role: string): string {
    return this.roleTranslationService.translateRole(role);
  }
}
