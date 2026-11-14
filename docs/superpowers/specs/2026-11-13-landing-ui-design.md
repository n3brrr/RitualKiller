# Landing y marco visual de RitualKiller

## Intención

La landing de `/` no cuenta el producto: un titular, tres tarjetas y un botón. La app autenticada sí tiene un lenguaje (negro, esencia verde, Cinzel, altar, rituales, mercado), pero la carga es un spinner blanco genérico y los hovers no comparten un gesto.

Hay que sustituir la landing por un resumen moderno de las pantallas reales, y alinear el marco de la app (navegación, botones, tarjetas, carga, vacíos y error) para que landing y producto se sientan la misma cosa. Las animaciones de hover, carga y estado tienen que parecer un ritual —la esencia que se enciende—, no un kit genérico.

## Para quién

Alguien que llega a `/` y decide si entra. Dentro, la misma persona usa el altar, los rituales y el resto de pantallas y debe reconocer el gesto visual que vio fuera.

## Objetivos

- Landing nueva en `/` que recorra el producto en el orden de la app: altar, rituales, objetivos, coven, mercado e inventario, analíticas y logros, y un cierre para entrar.
- Primitivos propios al estilo shadcn (borde fino, radio consistente, fondo `zinc-950`, tipografía ya del proyecto). Sin instalar shadcn, Radix ni `class-variance-authority`.
- Un gesto de interacción común: la esencia se enciende en el borde. Hover, foco, activo, pulsación, carga, vacío, error y un acuse breve al completar.
- GSAP solo en la landing, para revelados al entrar en vista. El hero se lee sin esperar a JavaScript.
- `prefers-reduced-motion` deja el contenido quieto y visible.

## No objetivos

- No se cambia la lógica de datos, rutas, auth, tienda, rituales ni copys de las pantallas interiores.
- No se reescribe cada formulario. Los campos conservan su comportamiento; solo heredan foco y borde si ya usan las clases compartidas.
- No se añaden capturas pesadas ni vídeo.
- No se internacionaliza la landing en este pase. El resto de la app sigue con i18n.
- No se elimina `framer-motion` del `package.json`. La landing y los primitivos nuevos no lo importan. `Reveal`, `ScrollIn` y `FeatureCard` se quedan sin uso nuevo.

## Anti-objetivos

- Una landing de marketing genérica (gradientes morados, mockups de stock, “features” en tres columnas sin las pantallas).
- Animación infinita en el hero, parallax continuo o scroll suave que secuestre la rueda.
- Escalar botones al 1.05 en cada hover. Ese gesto ya está en `Button` y no pertenece a la esencia.
- Cargar GSAP o ScrollTrigger en el bundle de la app autenticada.

## Restricciones

- Stack actual: React 19, Vite, Tailwind 3, GSAP 3.13 ya instalado, `pnpm`.
- Móvil primero. La landing es una columna y a `md` pasa a dos columnas en los bloques de pantalla.
- Tokens que ya existen: `ritual.black`, `ritual.dark`, `ritual.accent` (`#22c55e`), `ritual.blood`, Cinzel para títulos, Inter para cuerpo.
- El CSS global ya anula animaciones si `prefers-reduced-motion: reduce`. GSAP tiene que consultar lo mismo y no animar.
- La ruta `/` sigue siendo lazy. El login no cambia de ruta.

## Enfoques

1. **Primitivos propios + GSAP perezoso.** Elegido. Encaja con Tailwind y no mete Radix. La landing y el marco comparten botón, superficie e insignia.
2. **shadcn/ui oficial.** Más peso y diálogos duplicados con `Modal` y `ConfirmDialog`. El encargo pedía el estilo, no la librería.
3. **Clases sueltas en cada página.** El hover y la carga se vuelven a separar en el siguiente cambio.

El añadido pedido después —animaciones de estado, carga y hover con la esencia de la app— entra en el enfoque 1, no como librería de motion extra.

## Decisiones

### Gesto

La esencia es un filo verde que recorre el borde, no un rebote.

- Reposo: borde `zinc-800`, fondo `zinc-950` o transparente.
- Hover y foco visible: el borde pasa a `ritual-accent` en unos 200 ms y aparece un resplandor corto (`0 0 0 1px` más un blur verde muy bajo). El texto de un botón primario pasa a negro cuando el relleno verde termina de subir desde abajo (el CTA actual de la landing, generalizado).
- Activo / navegación actual: borde verde tenue y una barra de 2 px a la izquierda. Sin parpadeo.
- Pulsación: el relleno se oscurece un punto (`emerald-600`) durante 80 ms. Sin escala.
- Peligro (salir, borrar): el mismo gesto con `ritual.blood`, no con verde.

### Carga

Sustituir los anillos blancos de `Loading` (hoy están en `position: absolute` y se salen del flujo). El nuevo estado es CSS puro, sin GSAP:

- Un círculo de 40 px con trazo `ritual-accent` que se dibuja con `stroke-dashoffset` y rota una vuelta lenta.
- Texto existente «Cargando», en Cinzel, tracking amplio, `zinc-500`.
- `role="status"` se mantiene.
- Sirve para el `Suspense` de rutas y para los `return <Loading />` de las páginas. No hace falta tocar cada página más que si el import cambia de sitio; el default export sigue en el mismo archivo.

### Vacíos, error y acuse

Componentes pequeños, misma voz que el producto:

- Vacío: superficie con borde discontinuo, icono `lucide` en `zinc-600`, el texto que la página ya mostraba. Entra una vez con el fade CSS que ya existe (`animate-fade-in`). Se usa solo donde hoy hay un párrafo de lista vacía (hábitos, objetivos, inventario, notificaciones, social, tienda si ya tienen ese estado).
- Error: borde y fondo `ritual.blood` al 8 %, icono, el mensaje que ya viene del hook. Sin sacudida.
- Acuse de ritual completado: la barra o el botón de completar que ya existe recibe una clase de un pulso de opacidad del borde verde, 400 ms, una vez. No hay confetti ni cambio de datos.

### Landing

Sustituye `src/features/auth/pages/LandingPage.tsx`. Sigue montada en lazy en `/`. Copy en español, tono seco, las mismas palabras que la navegación (Altar, Rituales, Objetivos, Coven, Mercado, Inventario, Analíticas, Logros, esencia, rango, racha).

De arriba abajo:

1. Barra fija: calavera, RitualKiller, enlace Entrar a `/login`. Fondo `ritual-dark` al 90 % y blur. En móvil el enlace sigue visible.
2. Hero, visible al primer pintado: titular corto, una frase, botón primario «Empezar el ritual». A la derecha (debajo en móvil) un marco HTML del altar: esencia, rango, racha y un ritual de hoy marcado. No es una captura.
3. Rituales: lista de tres hábitos de ejemplo y una racha. Texto de qué se hace en esa pantalla.
4. Objetivos: una meta con barra de progreso.
5. Coven: una línea de actividad, sin feed real.
6. Mercado e inventario, en dos marcos: un objeto con precio en esencia y ese objeto ya en el inventario.
7. Analíticas y logros: una tira de días (el heatmap reducido a una fila) y dos insignias, una encendida.
8. Cierre: la misma frase del hero y el mismo botón.

Los marcos son componentes de presentación con datos fijos en el archivo de la landing. No llaman a Supabase ni a los hooks de la app.

GSAP:

- Import dinámico de `gsap` y `ScrollTrigger` dentro del efecto, después del primer pintado.
- `gsap.context` y limpieza al desmontar. Registrar el plugin solo ahí.
- El hero no se oculta. Si hay motion, solo un `y` de 12 px en el titular y el marco, opacidad siempre 1.
- Cada sección bajo el hero entra al cruzar el 85 % del viewport: `y` 16 px y opacidad de 0 a 1, 0.6 s, `power2.out`. Una vez. Sin scrub.
- Si `prefers-reduced-motion`, no se importa GSAP.
- Nada de `will-change` permanente, pin, ni animación de `box-shadow` en scroll.

### Marco de la app

- `AppLayout`: las clases del `NavLink` usan el gesto activo y el hover de esencia. La barra de progreso de esencia no se anima en bucle; al montar, la anchura pasa de 0 al valor en 500 ms solo si hay motion (transición CSS). El menú móvil aparece con fade del velo y un deslizamiento corto del panel (CSS). Cerrar sigue igual.
- `Button` deja `framer-motion` y pasa a ser un `<button>` con variantes `primary`, `ghost` y `danger`, más `className` y el resto de atributos de botón. Hover de relleno. Lo usa la landing. No hace falta migrar cada botón inline de las páginas en este pase: esos botones ganan el hover de borde mediante la clase compartida `.rk-btn` y `.rk-btn-ghost` aplicada donde el archivo ya tiene un botón con `hover:border-ritual-accent` o `bg-white` de acción principal. Los `onClick` no se tocan.
- Superficies repetidas (`rounded-xl border border-zinc-800 bg-zinc-950`) pasan a la clase `.rk-surface` en el layout y en las secciones de página que ya usan ese patrón. Sin hover en superficies estáticas. `.rk-surface-interactive` solo en tarjetas que ya son clicables.
- Espaciado del `main` se queda (`px-4`, `md:ml-64`, `max-w-7xl`). No se estrecha el contenido.

### Rendimiento

- La landing no importa `framer-motion`, `recharts` ni servicios.
- GSAP queda en el chunk de la landing, no en el grafo de `AppLayout`.
- Los marcos son HTML y CSS. Ningún bitmap de pantalla.
- El loader de ruta es CSS en el chunk común, pequeño, y sustituye al loader actual.
- Comprobar en build que `gsap` no aparece en el chunk del dashboard.

## Qué queda para quien lo construya

- El texto exacto de cada sección, dentro del tono y de los nombres de pantalla de arriba.
- Los tres rituales, la meta, el objeto de mercado y los dos logros de ejemplo. Datos fijos, coherentes con `data/items.ts` y `data/achievements.ts` si hay nombres que encajen; si no, inventar unos neutros.
- Nombres de archivo de los primitivos, bajo `src/components/ui/`, mientras el botón público siga pudiendo importarse como ahora si algo lo usara.
- Si un botón inline es demasiado distinto para `.rk-btn` sin cambiar el layout, dejarlo y no forzar la clase.

## Hecho cuando

- `/` muestra las ocho partes, se lee en móvil y a desktop, y Entrar lleva a `/login`.
- Con motion reducido no hay tween y no se pide GSAP.
- La carga de una ruta perezosa muestra el sigilo verde, no los anillos blancos.
- El ítem activo del sidebar tiene la barra verde; un botón primario rellena desde abajo al pasar el cursor.
- `pnpm typecheck`, `pnpm lint`, `pnpm test` y `pnpm build` pasan.
- El visualizer o el informe de chunks del build muestra `gsap` solo junto a la landing.
