import react from "react";

export default function Login() {
  return (
    <div class="ring">
      <i style="--clr:#00ff0a;"></i>
      <i style="--clr:#ff0057;"></i>
      <i style="--clr:#fffd44;"></i>
      <div class="login">
        <h2>Inicio de Sesión</h2>
        <div class="inputBx">
          <input type="text" placeholder="Usuario" />
        </div>
        <div class="inputBx">
          <input type="password" placeholder="Contraseña" />
        </div>
        <div class="inputBx">
          <input type="submit" value="Iniciar Sesión" />
        </div>
        <div class="links">
          <a href="#">Olvidaste la contraseña</a> {"Añadir los enlaces"}
          <a href="#">Registrarse</a>
        </div>
      </div>
    </div>
  );
}
