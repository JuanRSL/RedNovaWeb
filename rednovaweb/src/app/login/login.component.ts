import { Component } from '@angular/core';
import {ReactiveFormsModule, FormGroup, FormControl, Validators} from '@angular/forms';

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

    pruebaLogin() {
        if (this.formLogin.valid) {
            console.log('Hola :', this.formLogin.value);

            alert('Prueba Login Exitosa');
        }
    }
}

