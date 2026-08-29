// ==========================================
// SCRIPT DE CONTROL - JUANDA FLOW
// ==========================================

// Control de Tema Oscuro / Claro y Persistencia
function toggleModoOscuro() {
    const body = document.body;
    body.classList.toggle('dark-mode');
    
    const btnTema = document.getElementById('btn-modo-tema');
    if (body.classList.contains('dark-mode')) {
        btnTema.innerHTML = '☀️';
        localStorage.setItem('juanda_tema', 'dark');
    } else {
        btnTema.innerHTML = '🌙';
        localStorage.setItem('juanda_tema', 'light');
    }
}

window.addEventListener('DOMContentLoaded', () => {
    const temaGuardado = localStorage.getItem('juanda_tema');
    const btnTema = document.getElementById('btn-modo-tema');
    
    if (temaGuardado === 'dark') {
        document.body.classList.add('dark-mode');
        if (btnTema) btnTema.innerHTML = '☀️';
    } else {
        document.body.classList.remove('dark-mode');
        if (btnTema) btnTema.innerHTML = '🌙';
    }
});

// Ocultar pantalla de carga inicial al cargar la página
window.addEventListener('load', () => {
    setTimeout(() => {
        const carga = document.getElementById('pantalla-carga');
        if(carga) {
            carga.classList.add('fade-out');
            setTimeout(() => carga.style.display = 'none', 500);
        }
    }, 800);
});

// Control de vistas (Navegación general)
function cambiarVista(nombreVista) {
    // Ocultar todas las vistas estáticas principales
    const vistas = ['vista-home', 'vista-barberia', 'vista-boutique', 'vista-admin', 'vista-servicio-dinamico'];
    vistas.forEach(v => {
        const el = document.getElementById(v);
        if(el) el.classList.add('oculto');
    });

    // Si existen vistas dinámicas generadas, ocultarlas también
    document.querySelectorAll('.vista-dinamica-generada').forEach(el => el.classList.add('oculto'));

    // Mostrar la vista seleccionada
    if (nombreVista === 'home') {
        document.getElementById('vista-home').classList.remove('oculto');
    } else if (nombreVista === 'barberia') {
        document.getElementById('vista-barberia').classList.remove('oculto');
        cargarDiasDisponiblesCliente();
    } else if (nombreVista === 'boutique') {
        document.getElementById('vista-boutique').classList.remove('oculto');
        renderizarCatalogoBoutique();
        renderizarFiltrosBoutique();
    } else if (nombreVista === 'admin') {
        document.getElementById('vista-admin').classList.remove('oculto');
        renderizarAgendaAdmin();
        renderizarInventarioAdmin();
        renderizarCategoriasAdmin();
    } else {
        // Vistas de servicios dinámicos creados por el admin
        const vistaDinamica = document.getElementById('vista-' + nombreVista);
        if(vistaDinamica) {
            vistaDinamica.classList.remove('oculto');
        }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ------------------------------------------
// LÓGICA DE BARBERÍA Y CITAS
// ------------------------------------------
function cargarDiasDisponiblesCliente() {
    const select = document.getElementById('select-dia-cliente');
    const agenda = JSON.parse(localStorage.getItem('juanda_agenda')) || {};
    select.innerHTML = '<option value="">Selecciona un día</option>';
    
    const diasValidos = Object.keys(agenda).filter(dia => Object.keys(agenda[dia]).length > 0);
    
    if (diasValidos.length === 0) {
        select.innerHTML = '<option value="">No hay días disponibles actualmente</option>';
        return;
    }

    diasValidos.forEach(dia => {
        let opt = document.createElement('option');
        opt.value = dia;
        opt.textContent = dia;
        select.appendChild(opt);
    });
}

function mostrarHorasDelDia() {
    const dia = document.getElementById('select-dia-cliente').value;
    const gridHoras = document.getElementById('grid-horas');
    const formReserva = document.getElementById('form-reserva');
    
    gridHoras.innerHTML = '';
    formReserva.classList.add('oculto');

    if (!dia) return;

    const agenda = JSON.parse(localStorage.getItem('juanda_agenda')) || {};
    const horas = agenda[dia] || {};
    const horasDisponibles = Object.keys(horas).filter(h => horas[h] === 'disponible');

    if (horasDisponibles.length === 0) {
        gridHoras.innerHTML = '<p style="color: var(--text-muted); font-size: 13px;">No quedan horarios disponibles para este día.</p>';
        return;
    }

    horasDisponibles.forEach(hora => {
        let div = document.createElement('div');
        div.className = 'hora-slot';
        div.textContent = hora;
        div.onclick = () => seleccionarHoraCita(dia, hora);
        gridHoras.appendChild(div);
    });
}

function seleccionarHoraCita(dia, hora) {
    document.getElementById('dia-seleccionado-txt').textContent = dia;
    document.getElementById('hora-seleccionada').textContent = hora;
    document.getElementById('form-reserva').classList.remove('oculto');

    const btnConfirmar = document.getElementById('btn-enviar-cita');
    btnConfirmar.onclick = () => confirmarCitaWhatsApp(dia, hora);
}

function confirmarCitaWhatsApp(dia, hora) {
    const nombre = document.getElementById('nombre-cliente').value.trim();
    const telefono = document.getElementById('telefono-cliente').value.trim();

    if (!nombre || !telefono) {
        alert('Por favor, completa tu nombre y número de teléfono.');
        return;
    }

    let agenda = JSON.parse(localStorage.getItem('juanda_agenda')) || {};
    if (agenda[dia]) {
        agenda[dia][hora] = `Reservado por: ${nombre} (${telefono})`;
        localStorage.setItem('juanda_agenda', JSON.stringify(agenda));
    }

    const mensaje = `Hola Juanda Flow, quiero confirmar mi cita de Barbería:%0A- Día: ${dia}%0A- Hora: ${hora}%0A- Nombre: ${nombre}%0A- Teléfono: ${telefono}`;
    window.open(`https://wa.me/?text=${mensaje}`, '_blank');
    
    cambiarVista('home');
}

// ------------------------------------------
// LÓGICA DE BOUTIQUE Y CARRITO
// ------------------------------------------
let carrito = JSON.parse(localStorage.getItem('juanda_carrito')) || [];
actualizarContadorCarrito();

function agregarAlCarrito(producto, tallaSeleccionada) {
    let itemExistente = carrito.find(item => item.id === producto.id && item.talla === tallaSeleccionada);
    if (itemExistente) {
        itemExistente.cantidad += 1;
    } else {
        carrito.push({
            id: producto.id,
            nombre: producto.nombre,
            precio: producto.precio,
            imagen: producto.imagenes ? producto.imagenes[0] : '',
            talla: tallaSeleccionada || 'Única',
            cantidad: 1
        });
    }
    sincronizarCarrito();
    toggleCarritoModal();
}

function sincronizarCarrito() {
    localStorage.setItem('juanda_carrito', JSON.stringify(carrito));
    actualizarContadorCarrito();
}

function actualizarContadorCarrito() {
    const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);
    document.getElementById('contador-carrito').textContent = totalItems;
}

function toggleCarritoModal() {
    const modal = document.getElementById('modal-carrito');
    modal.classList.toggle('oculto');
    if (!modal.classList.contains('oculto')) {
        renderizarContenidoCarrito();
    }
}

function renderizarContenidoCarrito() {
    const contenedor = document.getElementById('lista-items-carrito');
    const totalPrecioElem = document.getElementById('carrito-total-precio');
    contenedor.innerHTML = '';

    if (carrito.length === 0) {
        contenedor.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 20px;">Tu carrito está vacío.</p>';
        totalPrecioElem.textContent = '$0';
        return;
    }

    let precioTotal = 0;
    carrito.forEach((item, index) => {
        precioTotal += item.precio * item.cantidad;
        let div = document.createElement('div');
        div.className = 'carrito-item';
        div.innerHTML = `
            <div class="carrito-item-detalles">
                <img src="${item.imagen || ''}" alt="${item.nombre}">
                <div class="carrito-item-info">
                    <h4>${item.nombre}</h4>
                    <span>Opción: ${item.talla} | $${item.precio.toLocaleString()} x ${item.cantidad}</span>
                </div>
            </div>
            <div class="carrito-item-controles">
                <button onclick="cambiarCantidadItem(${index}, 1)">+</button>
                <span>${item.cantidad}</span>
                <button onclick="cambiarCantidadItem(${index}, -1)">-</button>
            </div>
        `;
        contenedor.appendChild(div);
    });

    totalPrecioElem.textContent = '$' + precioTotal.toLocaleString();
}

function cambiarCantidadItem(index, cambio) {
    carrito[index].cantidad += cambio;
    if (carrito[index].cantidad <= 0) {
        carrito.splice(index, 1);
    }
    sincronizarCarrito();
    renderizarContenidoCarrito();
}

function enviarPedidoWhatsApp() {
    const nombre = document.getElementById('nombre-comprador').value.trim();
    const telefono = document.getElementById('telefono-comprador').value.trim();

    if (!nombre || !telefono) {
        alert('Por favor ingresa tu nombre y teléfono para el envío.');
        return;
    }

    if (carrito.length === 0) {
        alert('El carrito está vacío.');
        return;
    }

    let detallePedido = `Hola Juanda Flow, quiero realizar el siguiente pedido:%0A`;
    let total = 0;
    carrito.forEach(item => {
        detallePedido += `- ${item.nombre} (${item.talla}) x${item.cantidad} ($${(item.precio * item.cantidad).toLocaleString()})%0A`;
        total += item.precio * item.cantidad;
    });
    detallePedido += `%0ATotal a pagar: $${total.toLocaleString()}%0A- Nombre: ${nombre}%0A- Teléfono: ${telefono}`;

    window.open(`https://wa.me/?text=${detallePedido}`, '_blank');
    carrito = [];
    sincronizarCarrito();
    toggleCarritoModal();
}

// Catálogo y Filtros Boutique
function renderizarCatalogoBoutique(categoriaFiltro = 'todos') {
    const contenedor = document.getElementById('catalogo-productos');
    const productos = JSON.parse(localStorage.getItem('juanda_productos')) || [];
    contenedor.innerHTML = '';

    const filtrados = categoriaFiltro === 'todos' ? productos : productos.filter(p => p.categoria === categoriaFiltro);

    if (filtrados.length === 0) {
        contenedor.innerHTML = '<p style="color: var(--text-muted); grid-column: 1/-1; text-align: center; padding: 30px;">No hay productos disponibles en esta categoría.</p>';
        return;
    }

    filtrados.forEach(prod => {
        let card = document.createElement('div');
        card.className = 'producto-card';
        card.onclick = () => abrirModalDetalle(prod.id);
        card.innerHTML = `
            <img src="${prod.imagenes && prod.imagenes.length > 0 ? prod.imagenes[0] : ''}" alt="${prod.nombre}">
            <div class="producto-info">
                <h4>${prod.nombre}</h4>
                <div class="producto-precio">$${prod.precio.toLocaleString()}</div>
            </div>
        `;
        contenedor.appendChild(card);
    });
}

function renderizarFiltrosBoutique() {
    const contenedor = document.getElementById('contenedor-filtros-categorias');
    const categorias = JSON.parse(localStorage.getItem('juanda_categorias')) || ['General'];
    
    contenedor.innerHTML = '<button class="filtro-btn activo" onclick="filtrarProductos(\'todos\', this)">Todos</button>';
    
    categorias.forEach(cat => {
        let btn = document.createElement('button');
        btn.className = 'filtro-btn';
        btn.textContent = cat;
        btn.onclick = (e) => filtrarProductos(cat, e.target);
        contenedor.appendChild(btn);
    });
}

function filtrarProductos(categoria, elementoBtn) {
    if(elementoBtn) {
        document.querySelectorAll('.filtro-btn').forEach(b => b.classList.remove('activo'));
        elementoBtn.classList.add('activo');
    }
    renderizarCatalogoBoutique(categoria);
}

// Modal Detalle de Producto
function abrirModalDetalle(idProducto) {
    const productos = JSON.parse(localStorage.getItem('juanda_productos')) || [];
    const prod = productos.find(p => p.id === idProducto);
    if (!prod) return;

    document.getElementById('detalle-titulo').textContent = prod.nombre;
    document.getElementById('detalle-precio').textContent = '$' + prod.precio.toLocaleString();
    document.getElementById('detalle-caracteristicas').textContent = prod.caracteristicas || 'Sin descripción adicional.';
    
    const imgPrincipal = document.getElementById('detalle-img-principal');
    const minisContainer = document.getElementById('detalle-minis');
    minisContainer.innerHTML = '';

    if (prod.imagenes && prod.imagenes.length > 0) {
        imgPrincipal.src = prod.imagenes[0];
        prod.imagenes.forEach(imgUrl => {
            let thumb = document.createElement('img');
            thumb.src = imgUrl;
            thumb.onclick = () => imgPrincipal.src = imgUrl;
            minisContainer.appendChild(thumb);
        });
    } else {
        imgPrincipal.src = '';
    }

    const selectTalla = document.getElementById('detalle-select-talla');
    selectTalla.innerHTML = '';
    if (prod.tallas && prod.tallas.length > 0) {
        prod.tallas.forEach(t => {
            let opt = document.createElement('option');
            opt.value = t;
            opt.textContent = t;
            selectTalla.appendChild(opt);
        });
    } else {
        let opt = document.createElement('option');
        opt.value = 'Única';
        opt.textContent = 'Única';
        selectTalla.appendChild(opt);
    }

    const btnAgregar = document.getElementById('btn-agregar-desde-detalle');
    btnAgregar.onclick = () => {
        agregarAlCarrito(prod, selectTalla.value);
        cerrarModalDetalle();
    };

    document.getElementById('modal-detalle').classList.remove('oculto');
}

function cerrarModalDetalle() {
    document.getElementById('modal-detalle').classList.add('oculto');
}

// ------------------------------------------
// PANEL DE ADMINISTRACIÓN Y CONFIGURACIÓN
// ------------------------------------------
function comprobarAccesoAdmin() {
    document.getElementById('modal-login-admin').classList.remove('oculto');
}

function cerrarModalLogin() {
    document.getElementById('modal-login-admin').classList.add('oculto');
}

function validarCredencialesAdmin() {
    const clave = document.getElementById('input-clave-admin').value.trim();
    const passColab = localStorage.getItem('juanda_pass_colaborador') || 'colaborador123';

    if (clave === 'admin123') {
        localStorage.setItem('juanda_sesion', 'master');
        cerrarModalLogin();
        document.getElementById('input-clave-admin').value = '';
        document.getElementById('admin-solo-master').style.display = 'block';
        document.getElementById('titulo-panel-admin').textContent = 'Panel Administrador Master';
        cambiarVista('admin');
    } else if (clave === passColab) {
        localStorage.setItem('juanda_sesion', 'colaborador');
        cerrarModalLogin();
        document.getElementById('input-clave-admin').value = '';
        document.getElementById('admin-solo-master').style.display = 'none';
        document.getElementById('titulo-panel-admin').textContent = 'Panel de Colaborador';
        cambiarVista('admin');
    } else {
        alert('Contraseña incorrecta.');
    }
}

function cerrarSesionAdmin() {
    localStorage.removeItem('juanda_sesion');
    cambiarVista('home');
}

function guardarHorariosMasivos() {
    const diasSeleccionados = Array.from(document.querySelectorAll('input[name="dias-admin"]:checked')).map(cb => cb.value);
    const horasSeleccionadas = Array.from(document.querySelectorAll('input[name="horas-admin"]:checked')).map(cb => cb.value);

    if(diasSeleccionados.length === 0 || horasSeleccionadas.length === 0) {
        alert('Selecciona al menos un día y una hora.');
        return;
    }

    let agenda = JSON.parse(localStorage.getItem('juanda_agenda')) || {};
    diasSeleccionados.forEach(dia => {
        if (!agenda[dia]) agenda[dia] = {};
        horasSeleccionadas.forEach(hora => {
            agenda[dia][hora] = 'disponible';
        });
    });

    localStorage.setItem('juanda_agenda', JSON.stringify(agenda));
    alert('Horarios habilitados correctamente.');
    renderizarAgendaAdmin();
}

function limpiarAgendaAdmin() {
    if(confirm('¿Estás seguro de borrar toda la agenda?')) {
        localStorage.removeItem('juanda_agenda');
        renderizarAgendaAdmin();
    }
}

function renderizarAgendaAdmin() {
    const contenedor = document.getElementById('lista-agenda-admin');
    const agenda = JSON.parse(localStorage.getItem('juanda_agenda')) || {};
    contenedor.innerHTML = '<h4>Agenda Configurada:</h4>';
    
    let dias = Object.keys(agenda);
    if(dias.length === 0) {
        contenedor.innerHTML += '<p>No hay turnos creados.</p>';
        return;
    }

    dias.forEach(dia => {
        let horas = Object.keys(agenda[dia]);
        contenedor.innerHTML += `<p><b>${dia}:</b> ${horas.join(', ')}</p>`;
    });
}

function agregarCategoriaBoutique() {
    const input = document.getElementById('input-nueva-categoria');
    const nuevaCat = input.value.trim();
    if(!nuevaCat) return;

    let categorias = JSON.parse(localStorage.getItem('juanda_categorias')) || ['General'];
    if(!categorias.includes(nuevaCat)) {
        categorias.push(nuevaCat);
        localStorage.setItem('juanda_categorias', JSON.stringify(categorias));
    }
    input.value = '';
    renderizarCategoriasAdmin();
    renderizarFiltrosBoutique();
}

function renderizarCategoriasAdmin() {
    const selectProd = document.getElementById('prod-categoria');
    const listaCatAdmin = document.getElementById('lista-categorias-admin');
    const categorias = JSON.parse(localStorage.getItem('juanda_categorias')) || ['General'];
    
    selectProd.innerHTML = '';
    listaCatAdmin.innerHTML = '<b>Categorías existentes:</b> ';

    categorias.forEach(cat => {
        let opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        selectProd.appendChild(opt);
    });
    listaCatAdmin.innerHTML += categorias.join(', ');
}

function subirProductoConCheckboxes() {
    const nombre = document.getElementById('prod-nombre').value.trim();
    const categoria = document.getElementById('prod-categoria').value;
    const precio = parseFloat(document.getElementById('prod-precio').value);
    const caracteristicas = document.getElementById('prod-caracteristicas').value.trim();
    const inputArchivos = document.getElementById('prod-imagenes');

    const checkboxesTallas = document.querySelectorAll('#grupo-checkboxes-tallas input[type="checkbox"]:checked');
    let tallasSeleccionadas = Array.from(checkboxesTallas).map(cb => cb.value);
    if(tallasSeleccionadas.length === 0) tallasSeleccionadas = ['Única'];

    if(!nombre || isNaN(precio)) {
        alert('Por favor ingresa nombre y precio válido.');
        return;
    }

    let productos = JSON.parse(localStorage.getItem('juanda_productos')) || [];
    
    let archivosPromesas = Array.from(inputArchivos.files).map(file => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(file);
        });
    });

    Promise.all(archivosPromesas).then(imagenesBase64 => {
        const nuevoProd = {
            id: Date.now(),
            nombre,
            categoria,
            precio,
            caracteristicas,
            tallas: tallasSeleccionadas,
            imagenes: imagenesBase64
        };

        productos.push(nuevoProd);
        localStorage.setItem('juanda_productos', JSON.stringify(productos));
        
        alert('¡Producto guardado con éxito!');
        document.getElementById('prod-nombre').value = '';
        document.getElementById('prod-precio').value = '';
        document.getElementById('prod-caracteristicas').value = '';
        document.getElementById('prod-imagenes').value = '';
        renderizarInventarioAdmin();
    });
}

function renderizarInventarioAdmin() {
    const contenedor = document.getElementById('lista-inventario-admin');
    const productos = JSON.parse(localStorage.getItem('juanda_productos')) || [];
    contenedor.innerHTML = '';

    if(productos.length === 0) {
        contenedor.innerHTML = '<p style="color: var(--text-muted); grid-column: 1/-1;">No hay productos en inventario.</p>';
        return;
    }

    productos.forEach(prod => {
        let card = document.createElement('div');
        card.className = 'producto-card';
        card.innerHTML = `
            <img src="${prod.imagenes && prod.imagenes.length > 0 ? prod.imagenes[0] : ''}" alt="${prod.nombre}">
            <div class="producto-info">
                <h4>${prod.nombre}</h4>
                <div class="producto-precio">$${prod.precio.toLocaleString()}</div>
                <button class="btn-danger" style="margin-top: 10px; padding: 6px;" onclick="eliminarProducto(${prod.id})">Eliminar</button>
            </div>
        `;
        contenedor.appendChild(card);
    });
}

function eliminarProducto(id) {
    let productos = JSON.parse(localStorage.getItem('juanda_productos')) || [];
    productos = productos.filter(p => p.id !== id);
    localStorage.setItem('juanda_productos', JSON.stringify(productos));
    renderizarInventarioAdmin();
}

function guardarRolColaborador() {
    const clave = document.getElementById('pass-colaborador').value.trim();
    if(!clave) return;
    localStorage.setItem('juanda_pass_colaborador', clave);
    alert('Contraseña de colaborador guardada exitosamente.');
    document.getElementById('pass-colaborador').value = '';
}

function crearNuevoServicio() {
    const nombre = document.getElementById('nuevo-servicio-nombre').value.trim();
    const desc = document.getElementById('nuevo-servicio-desc').value.trim();
    if(!nombre) return;

    let idSlug = nombre.toLowerCase().replace(/\s+/g, '-');

    const nav = document.getElementById('menu-navegacion-superior');
    let nuevoBtn = document.createElement('button');
    nuevoBtn.textContent = nombre;
    nuevoBtn.onclick = () => cambiarVista(idSlug);
    nav.insertBefore(nuevoBtn, document.querySelector('.btn-admin-nav'));

    let seccion = document.createElement('section');
    seccion.id = 'vista-' + idSlug;
    seccion.className = 'vista oculto vista-dinamica-generada';
    seccion.innerHTML = `
        <h2 style="font-weight: 300; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 20px;">${nombre}</h2>
        <div class="servicio-personalizado-container">
            <p style="color: var(--text-muted); line-height: 1.6; font-size: 15px;">${desc}</p>
        </div>
    `;
    document.body.appendChild(seccion);

    alert(`¡Sección "${nombre}" creada y añadida al menú superior!`);
    document.getElementById('nuevo-servicio-nombre').value = '';
    document.getElementById('nuevo-servicio-desc').value = '';
}