// Se guarda la clave del almacenamiento para mantener el carrito aunque recargue la página.
const STORAGE_KEY = 'carritoCompras_productos';

// Se seleccionan los elementos del DOM para manipular la vista y la lógica del carrito.
const app = document.querySelector('.carrito-app');
const form = document.getElementById('formProducto');
const productoIdInput = document.getElementById('productoId');
const nombreInput = document.getElementById('nombreProducto');
const precioInput = document.getElementById('precioProducto');
const cantidadInput = document.getElementById('cantidadProducto');
const botonAgregar = document.getElementById('btnAgregar');
const buscarInput = document.getElementById('buscarProducto');
const listaProductos = document.getElementById('listaProductos');
const totalCarrito = document.getElementById('totalCarrito');
const mensaje = document.getElementById('mensaje');

// El filtro de búsqueda permite localizar un producto rápidamente cuando el carrito crece.
let filtroBusqueda = '';

// Los datos iniciales ayudan a mostrar un carrito con productos variados desde la primera carga.
let productos = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [
  { id: generarId(), nombre: 'Laptop Pro', precio: 1450, cantidad: 1 },
  { id: generarId(), nombre: 'Auriculares Wireless', precio: 120, cantidad: 2 },
  { id: generarId(), nombre: 'Cafetera Compacta', precio: 85, cantidad: 1 }
];

// Se genera un identificador único por producto para editar y eliminar correctamente.
function generarId() {
  if (window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `producto-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

// Se guarda el historial del carrito en localStorage para recordar la información.
function guardarProductos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(productos));
}

// Se actualiza el texto visible del usuario sin usar innerHTML.
function mostrarMensaje(texto, tipo = 'success') {
  mensaje.textContent = texto;
  mensaje.style.color = tipo === 'error' ? '#a63d3d' : '#1c7a57';
}

// Se limpia el formulario y vuelve a la acción de crear un nuevo producto.
function resetFormulario(mensajeTexto = '') {
  form.reset();
  productoIdInput.value = '';
  botonAgregar.textContent = 'Agregar producto';

  if (mensajeTexto) {
    mostrarMensaje(mensajeTexto);
    return;
  }

  mensaje.textContent = '';
}

// Se normaliza el texto para comparar nombres sin distinguir mayúsculas y minúsculas.
function normalizarNombre(nombre) {
  return nombre.trim().toLowerCase();
}

// Se verifica si ya existe otro producto con el mismo nombre, salvo cuando se está editando el mismo registro.
function existeNombreDuplicado(nombre, productoActualId = '') {
  const nombreNormalizado = normalizarNombre(nombre);

  return productos.some((producto) => {
    return producto.id !== productoActualId && normalizarNombre(producto.nombre) === nombreNormalizado;
  });
}

// Se revisa la validez de los campos antes de guardar la información.
function validarProducto(nombre, precio, cantidad, productoActualId = '') {
  if (!nombre || !nombre.trim()) {
    mostrarMensaje('El nombre del producto es obligatorio.', 'error');
    nombreInput.focus();
    return false;
  }

  if (existeNombreDuplicado(nombre, productoActualId)) {
    mostrarMensaje('Ya existe otro producto con ese nombre.', 'error');
    nombreInput.focus();
    return false;
  }

  if (Number(precio) <= 0) {
    mostrarMensaje('El precio debe ser mayor a cero.', 'error');
    precioInput.focus();
    return false;
  }

  if (Number(cantidad) <= 0 || !Number.isInteger(Number(cantidad))) {
    mostrarMensaje('La cantidad debe ser un número entero mayor a cero.', 'error');
    cantidadInput.focus();
    return false;
  }

  return true;
}

// Se calcula el total del carrito para mostrar un resumen final al usuario.
function actualizarTotal() {
  const total = productos.reduce((acumulado, producto) => {
    return acumulado + producto.precio * producto.cantidad;
  }, 0);

  totalCarrito.textContent = formatearMoneda(total);
}

// Se formatea el valor monetario para una vista clara y ordenada.
function formatearMoneda(valor) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(valor);
}

// Se filtran los productos visibles según la búsqueda del usuario.
function obtenerProductosFiltrados() {
  const texto = filtroBusqueda.trim().toLowerCase();

  if (!texto) {
    return productos;
  }

  return productos.filter((producto) => producto.nombre.toLowerCase().includes(texto));
}

// Se renderiza la tabla con cada fila y sus acciones CRUD.
function renderProductos() {
  listaProductos.replaceChildren();
  const productosFiltrados = obtenerProductosFiltrados();

  if (productosFiltrados.length === 0) {
    const filaVacia = document.createElement('tr');
    const celdaVacia = document.createElement('td');
    celdaVacia.colSpan = 5;
    celdaVacia.textContent = 'No se encontraron productos con ese filtro.';
    filaVacia.appendChild(celdaVacia);
    listaProductos.appendChild(filaVacia);
    actualizarTotal();
    return;
  }

  productosFiltrados.forEach((producto) => {
    const fila = document.createElement('tr');
    fila.dataset.id = producto.id;

    const celdaNombre = document.createElement('td');
    const nombre = document.createElement('span');
    nombre.className = 'producto-nombre';
    nombre.textContent = producto.nombre;
    celdaNombre.appendChild(nombre);

    const celdaPrecio = document.createElement('td');
    celdaPrecio.className = 'precio-celda';
    celdaPrecio.textContent = formatearMoneda(producto.precio);

    const celdaCantidad = document.createElement('td');
    const controlCantidad = document.createElement('div');
    controlCantidad.className = 'cantidad-control';

    const botonRestar = document.createElement('button');
    botonRestar.type = 'button';
    botonRestar.dataset.action = 'restar';
    botonRestar.dataset.id = producto.id;
    botonRestar.textContent = '-';

    const cantidadMostrada = document.createElement('span');
    cantidadMostrada.textContent = String(producto.cantidad);

    const botonSumar = document.createElement('button');
    botonSumar.type = 'button';
    botonSumar.dataset.action = 'sumar';
    botonSumar.dataset.id = producto.id;
    botonSumar.textContent = '+';

    controlCantidad.appendChild(botonRestar);
    controlCantidad.appendChild(cantidadMostrada);
    controlCantidad.appendChild(botonSumar);
    celdaCantidad.appendChild(controlCantidad);

    const celdaSubtotal = document.createElement('td');
    celdaSubtotal.className = 'subtotal-celda';
    celdaSubtotal.textContent = formatearMoneda(producto.precio * producto.cantidad);

    const celdaAcciones = document.createElement('td');
    celdaAcciones.className = 'acciones-celda';

    const botonEditar = document.createElement('button');
    botonEditar.type = 'button';
    botonEditar.className = 'btn-ghost';
    botonEditar.dataset.action = 'editar';
    botonEditar.dataset.id = producto.id;
    botonEditar.textContent = 'Editar';

    const botonEliminar = document.createElement('button');
    botonEliminar.type = 'button';
    botonEliminar.className = 'btn-danger';
    botonEliminar.dataset.action = 'eliminar';
    botonEliminar.dataset.id = producto.id;
    botonEliminar.textContent = 'Eliminar';

    celdaAcciones.appendChild(botonEditar);
    celdaAcciones.appendChild(botonEliminar);

    fila.appendChild(celdaNombre);
    fila.appendChild(celdaPrecio);
    fila.appendChild(celdaCantidad);
    fila.appendChild(celdaSubtotal);
    fila.appendChild(celdaAcciones);

    listaProductos.appendChild(fila);
  });

  actualizarTotal();
}

// Se prepara la edición de una fila usando DOM Traversing para localizar la fila y sus datos.
function prepararEdicion(fila) {
  const id = fila.dataset.id;
  const producto = productos.find((item) => item.id === id);

  if (!producto) {
    mostrarMensaje('No se pudo encontrar el producto para editar.', 'error');
    return;
  }

  const nombreActual = fila.querySelector('.producto-nombre');
  productoIdInput.value = producto.id;
  nombreInput.value = producto.nombre;
  precioInput.value = producto.precio;
  cantidadInput.value = producto.cantidad;
  botonAgregar.textContent = 'Guardar cambios';

  if (nombreActual) {
    mostrarMensaje(`Editando: ${nombreActual.textContent}`);
  }
}

// Se activa la edición directa dentro de la misma fila para modificar datos sin salir de la tabla.
function activarEdicionDirecta(fila) {
  const id = fila.dataset.id;
  const producto = productos.find((item) => item.id === id);

  if (!producto) {
    mostrarMensaje('No se pudo abrir la edición del producto.', 'error');
    return;
  }

  const celdas = Array.from(fila.children);
  const nombreCell = celdas[0];
  const precioCell = celdas[1];
  const cantidadCell = celdas[2];
  const accionesCell = celdas[4];

  const nombreInput = document.createElement('input');
  nombreInput.type = 'text';
  nombreInput.className = 'input-editar';
  nombreInput.value = producto.nombre;
  nombreInput.dataset.role = 'nombre-edit';

  const precioInput = document.createElement('input');
  precioInput.type = 'number';
  precioInput.min = '0';
  precioInput.step = '0.01';
  precioInput.className = 'input-editar';
  precioInput.value = String(producto.precio);
  precioInput.dataset.role = 'precio-edit';

  const cantidadInput = document.createElement('input');
  cantidadInput.type = 'number';
  cantidadInput.min = '1';
  cantidadInput.step = '1';
  cantidadInput.className = 'input-editar';
  cantidadInput.value = String(producto.cantidad);
  cantidadInput.dataset.role = 'cantidad-edit';

  nombreCell.replaceChildren(nombreInput);
  precioCell.replaceChildren(precioInput);
  cantidadCell.replaceChildren(cantidadInput);

  const guardarBtn = document.createElement('button');
  guardarBtn.type = 'button';
  guardarBtn.className = 'btn btn-primary';
  guardarBtn.dataset.action = 'guardar-fila';
  guardarBtn.dataset.id = producto.id;
  guardarBtn.textContent = 'Guardar';

  const cancelarBtn = document.createElement('button');
  cancelarBtn.type = 'button';
  cancelarBtn.className = 'btn btn-secondary';
  cancelarBtn.dataset.action = 'cancelar-fila';
  cancelarBtn.dataset.id = producto.id;
  cancelarBtn.textContent = 'Cancelar';

  accionesCell.replaceChildren(guardarBtn, cancelarBtn);
  fila.dataset.editando = 'true';
  mostrarMensaje(`Editando: ${producto.nombre}`);
}

// Se crea o actualiza el producto según la acción en curso del formulario.
function guardarProducto() {
  const nombre = nombreInput.value.trim();
  const precio = Number(precioInput.value);
  const cantidad = Number(cantidadInput.value);

  if (!validarProducto(nombre, precio, cantidad, productoIdInput.value || '')) {
    return;
  }

  const productoId = productoIdInput.value;

  if (productoId) {
    productos = productos.map((producto) => {
      if (producto.id === productoId) {
        return {
          ...producto,
          nombre,
          precio,
          cantidad
        };
      }

      return producto;
    });

    mostrarMensaje('Producto actualizado correctamente.');
  } else {
    productos.push({
      id: generarId(),
      nombre,
      precio,
      cantidad
    });

    mostrarMensaje('Producto agregado al carrito.');
  }

  guardarProductos();
  renderProductos();

  if (productoId) {
    resetFormulario('Producto actualizado correctamente.');
  } else {
    resetFormulario('Producto agregado al carrito.');
  }
}

// Se elimina una fila del carrito y se mantiene la lista actualizada en almacenamiento.
function eliminarProducto(fila) {
  const id = fila.dataset.id;
  const producto = productos.find((item) => item.id === id);

  if (!producto) {
    mostrarMensaje('El producto seleccionado ya no está disponible.', 'error');
    return;
  }

  const hermanos = Array.from(fila.parentElement.children).filter((elemento) => elemento !== fila);
  productos = productos.filter((item) => item.id !== id);
  guardarProductos();
  renderProductos();

  if (hermanos.length === 0) {
    mostrarMensaje('El carrito quedó vacío.');
    return;
  }

  mostrarMensaje(`Se eliminó ${producto.nombre}.`);
}

// Se busca por nombre dentro del carrito para evitar revisar filas largas manualmente.
function buscarProductos() {
  filtroBusqueda = buscarInput.value.trim();
  renderProductos();

  if (filtroBusqueda) {
    mostrarMensaje(`Mostrando resultados para: ${filtroBusqueda}`);
    return;
  }

  mostrarMensaje('Carrito listo para usar.');
}

// Se limpia el filtro activo para volver a ver todo el carrito.
function limpiarFiltro() {
  buscarInput.value = '';
  filtroBusqueda = '';
  renderProductos();
  mostrarMensaje('Filtro eliminado. Mostrando todos los productos.');
}

// Se guarda la edición directa realizada dentro de la fila del carrito.
function guardarEdicionFila(fila) {
  const id = fila.dataset.id;
  const producto = productos.find((item) => item.id === id);

  if (!producto) {
    mostrarMensaje('No se encontró el producto para guardar.', 'error');
    return;
  }

  const nombreInputFila = fila.querySelector('[data-role="nombre-edit"]');
  const precioInputFila = fila.querySelector('[data-role="precio-edit"]');
  const cantidadInputFila = fila.querySelector('[data-role="cantidad-edit"]');

  if (!nombreInputFila || !precioInputFila || !cantidadInputFila) {
    mostrarMensaje('Faltan datos para guardar la edición.', 'error');
    return;
  }

  const nombre = nombreInputFila.value.trim();
  const precio = Number(precioInputFila.value);
  const cantidad = Number(cantidadInputFila.value);

  if (!validarProducto(nombre, precio, cantidad, id)) {
    return;
  }

  producto.nombre = nombre;
  producto.precio = precio;
  producto.cantidad = cantidad;

  guardarProductos();
  renderProductos();
  mostrarMensaje('Producto actualizado en la fila.');
}

// Se aumenta o disminuye la cantidad del producto desde la fila del carrito.
function ajustarCantidad(fila, operacion) {
  const id = fila.dataset.id;
  const producto = productos.find((item) => item.id === id);

  if (!producto) {
    mostrarMensaje('No se encontró el producto para actualizar la cantidad.', 'error');
    return;
  }

  if (operacion === 'sumar') {
    producto.cantidad += 1;
  }

  if (operacion === 'restar') {
    producto.cantidad = Math.max(1, producto.cantidad - 1);
  }

  guardarProductos();
  renderProductos();
  mostrarMensaje(`Cantidad actualizada para ${producto.nombre}.`);
}

// Se maneja toda la interacción del usuario mediante delegación de eventos.
app.addEventListener('click', (event) => {
  const boton = event.target.closest('button');

  if (!boton) {
    return;
  }

  const accion = boton.dataset.action;

  if (accion === 'buscar') {
    buscarProductos();
    return;
  }

  if (accion === 'limpiar-filtro') {
    limpiarFiltro();
    return;
  }

  if (accion === 'agregar') {
    guardarProducto();
    return;
  }

  if (accion === 'cancelar') {
    resetFormulario();
    return;
  }

  if (accion === 'editar') {
    const fila = boton.closest('tr');

    if (fila) {
      activarEdicionDirecta(fila);
      prepararEdicion(fila);
    }

    return;
  }

  if (accion === 'guardar-fila') {
    const fila = boton.closest('tr');

    if (fila) {
      guardarEdicionFila(fila);
    }

    return;
  }

  if (accion === 'cancelar-fila') {
    const fila = boton.closest('tr');

    if (fila) {
      renderProductos();
      mostrarMensaje('Edición cancelada.');
    }

    return;
  }

  if (accion === 'eliminar') {
    const fila = boton.closest('tr');

    if (fila) {
      eliminarProducto(fila);
    }

    return;
  }

  if (accion === 'sumar' || accion === 'restar') {
    const fila = boton.closest('tr');

    if (fila) {
      ajustarCantidad(fila, accion);
    }
  }
});

// Se carga el estado inicial del carrito al abrir la página.
renderProductos();
mostrarMensaje('Carrito listo para usar.');
