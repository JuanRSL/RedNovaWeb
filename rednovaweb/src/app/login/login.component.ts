import { Component } from '@angular/core';
import {ReactiveFormsModule, FormGroup, FormControl, Validators} from '@angular/forms';
import { AuthService } from '../services/auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [ReactiveFormsModule],
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss']
})
export class LoginComponent {
    formLogin = new FormGroup({
        email: new FormControl('', [Validators.required, Validators.email]),
        password: new FormControl('', [Validators.required])
    });

    constructor(private authService: AuthService) {}

    pruebaLogin() {
        if (this.formLogin.valid) {
            
            this.authService.login(this.formLogin.value).subscribe(
                {next: (respuesta: any) => {
                  console.log('El servidor responde: ', respuesta);

                    alert('Prueba Login Exitosa');  
                },
                error: (error: any) => {
                    console.log('UPSS', error);
                    alert('Prueba Login Fallida');

                }
            });
        }
    }
}

