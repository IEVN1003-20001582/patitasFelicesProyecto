@Component({
  selector: 'app-configuracion-veterinario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mi-perfil.component.html',

})
export class ConfiguracionVeterinarioComponent implements OnInit {

  usuarioActual: any = null;
  vetPerfil: Veterinario = { 
    nombre_completo: '', email: '', cedula: '', especialidad: '', turno: '', foto_url: '' 
  };

  passwordForm = { actual: '', nueva: '', confirmar: '' };

  especialidades = [
    'Medicina General',
    'Cirugía General',
    'Cardiología',
    'Dermatología',
    'Ortopedia',
    'Oftalmología',
    'Odontología',
    'Medicina Interna',
    'Neurología',
    'Oncología',
    'Etología'
  ];

  constructor(
    private authService: AuthService,
    private veterinariosService: VeterinariosService,
    private configService: ConfiguracionService
  ) {}

  ngOnInit(): void {
    this.usuarioActual = this.authService.getUsuarioActualValue();
    this.cargarPerfil();
  }

  cargarPerfil() {
    if (!this.usuarioActual) return;

    this.veterinariosService.getVeterinarios().subscribe((res: any) => {
        const todos = res.veterinarios || [];
        const miPerfil = todos.find((v: any) => v.user_id === this.usuarioActual.id);
        
        if (miPerfil) {
            this.vetPerfil = {
                id: miPerfil.id,
                user_id: miPerfil.user_id,
                nombre_completo: miPerfil.nombre_completo,
                email: miPerfil.email, 
                cedula: miPerfil.cedula_profesional || miPerfil.cedula,
                especialidad: miPerfil.especialidad,
                turno: miPerfil.turno,
                foto_url: miPerfil.foto_url
            };
        }
    });
  }

  guardarDatos() {
    if (!this.vetPerfil.id) return;

    this.veterinariosService.actualizarVeterinario(this.vetPerfil.id, this.vetPerfil).subscribe(res => {
        if(res.exito) {
            Swal.fire('Guardado', 'Tu información ha sido actualizada', 'success');
        } else {
            Swal.fire('Error', res.mensaje, 'error');
        }
    });
  }

  cambiarPassword() {
      if (this.passwordForm.nueva !== this.passwordForm.confirmar) {
          Swal.fire('Error', 'Las contraseñas no coinciden', 'warning');
          return;
      }
      
      const payload = {
          user_id: this.usuarioActual.id,
          actual: this.passwordForm.actual,
          nueva: this.passwordForm.nueva
      };

      this.configService.cambiarPassword(payload).subscribe(res => {
          if(res.exito) {
              Swal.fire('Éxito', 'Contraseña actualizada. Por favor inicia sesión de nuevo.', 'success')
              .then(() => {
                  this.authService.logout();
              });
          } else {
              Swal.fire('Error', res.mensaje, 'error');
          }
      });
  }
}