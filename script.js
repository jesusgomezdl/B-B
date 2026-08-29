let agendaBarberia = JSON.parse(localStorage.getItem('agendaBarberia')) || {}; 
let productosBoutique = JSON.parse(localStorage.getItem('productos')) || [];
let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
let categoriasBoutique = JSON.parse(localStorage.getItem('categoriasBoutique')) || ['Ropa', 'Calzado', 'Colonias', 'Accesorios'];
let configuracionHero = JSON.parse(localStorage.getItem('configuracionHero')) || {
    titulo: "Diseñando tu Estilo",
    subtitulo: "Exclusividad y Cuidado Personal",
    descripcion: "Estamos enfocados en conseguir tu mejor imagen, diseñando y personalizando tu estilo según tus preferencias y necesidades profesionales.",
    imagenFondo: ""
};

let passAdminMaster = "admin123";
let passColaborador = localStorage.getItem('passColaborador') || "collab123";
let rolActualSession = null;

let diaSeleccionado = "";
let horaSeleccionada = "";
let productoActualDetalle = null;

document.addEventListener("DOMContentLoaded", () => {
    actualizarSelectDiasCliente();
    renderizarCategoriasSelect();
    renderizarFiltrosBoutique();
    renderizarProductos('todos');
    renderizarInventarioAdmin();
    actualizarContadorCarrito();
    actualizarListaAgendaAdmin();
    aplicarConfigHeroVisual();
    renderizarListaCategoriasAdmin();
});

function cambiarVista(nombreVista) {
    const vistasBase = ['home', 'barberia', 'boutique', 'admin'];
    vistasBase.forEach(v => {
        const el = document.getElementById(`vista-${v}`);
        if(el) el.classList.add('oculto');
    });

    const destino = document.getElementById(`vista-${nombreVista}`);
    if(destino) destino.classList.remove('oculto');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function aplicarConfigHeroVisual() {
    const hero = document.getElementById("hero-contenedor-principal");
    const t = document.getElementById("hero-titulo");
    const d = document.getElementById("hero-descripcion");
    if(!hero) return;

    if(configuracionHero.imagenFondo) {
        hero.style.backgroundImage = `url('${configuracionHero.imagenFondo}')`;
    }
    t.innerHTML = `${configuracionHero.titulo} <span>${configuracionHero.subtitulo}</span>`;
    d.innerText = configuracionHero.descripcion;
}

function guardarConfigHero() {
    const inputTitulo = document.getElementById("config-titulo-hero").value;
    const inputDesc = document.getElementById("config-desc-hero").value;
    const fileInput = document.getElementById("config-img-fondo");

    if(inputTitulo) configuracionHero.titulo = inputTitulo;
    if(inputDesc) configuracionHero.descripcion = inputDesc;

    if(fileInput.files.length > 0) {
        const reader = new FileReader();
        reader.onload = function(e) {
            configuracionHero.imagenFondo = e.target.result;
            localStorage.setItem('configuracionHero', JSON.stringify(configuracionHero));
            aplicarConfigHeroVisual();
            alert("Configuración de diseño actualizada.");
        };
        reader.readAsDataURL(fileInput.files[0]);
    } else {
        localStorage.setItem('configuracionHero', JSON.stringify(configuracionHero));
        aplicarConfigHeroVisual();
        alert("Configuración de diseño actualizada.");
    }
}

function comprobarAccesoAdmin() {
    if(rolActualSession) {
        cambiarVista('admin');
    } else {
        document.getElementById("modal-login-admin").classList.remove("oculto");
    }
}

function cerrarModalLogin() {
    document.getElementById("modal-login-admin").classList.add("oculto");
}

function validarCredencialesAdmin() {
    const clave = document.getElementById("input-clave-admin").value;
    if(clave === passAdminMaster) {
        rolActualSession = 'master';
        aplicarPermisosRol();
        cerrarModalLogin();
        cambiarVista('admin');
    } else if(clave === passColaborador) {
        rolActualSession = 'colaborador';
        aplicarPermisosRol();
        cerrarModalLogin();
        cambiarVista('admin');
    } else {
        alert("Contraseña incorrecta.");
    }
    document.getElementById("input-clave-admin").value = "";
}

function aplicarPermisosRol() {
    const masterSec = document.getElementById("admin-solo-master");
    const tituloPanel = document.getElementById("titulo-panel-admin");
    
    if(rolActualSession === 'master') {
        if(masterSec) masterSec.style.display = 'block';
        if(tituloPanel) tituloPanel.innerText = "Panel de Administrador General";
    } else if(rolActualSession === 'colaborador') {
        if(masterSec) masterSec.style.display = 'none';
        if(tituloPanel) tituloPanel.innerText = "Panel de Colaborador (Citas y Boutique)";
    }
}

function cerrarSesionAdmin() {
    rolActualSession = null;
    cambiarVista('home');
}

function guardarRolColaborador() {
    const nuevaClave = document.getElementById("pass-colaborador").value;
    if(!nuevaClave) return;
    passColaborador = nuevaClave;
    localStorage.setItem('passColaborador', passColaborador);
    alert("Contraseña de colaborador actualizada con éxito.");
    document.getElementById("pass-colaborador").value = "";
}

function agregarCategoriaBoutique() {
    const nueva = document.getElementById("input-nueva-categoria").value.trim();
    if(!nueva) return;

    if(!categoriasBoutique.includes(nueva)) {
        categoriasBoutique.push(nueva);
        localStorage.setItem('categoriasBoutique', JSON.stringify(categoriasBoutique));
        renderizarCategoriasSelect();
        renderizarFiltrosBoutique();
        renderizarListaCategoriasAdmin();
        alert("Categoría añadida con éxito.");
    } else {
        alert("Esta categoría ya existe.");
    }
    document.getElementById("input-nueva-categoria").value = "";
}

function renderizarCategoriasSelect() {
    const select = document.getElementById("prod-categoria");
    if(!select) return;
    select.innerHTML = "";
    categoriasBoutique.forEach(cat => {
        const opt = document.createElement("option");
        opt.value = cat;
        opt.innerText = cat;
        select.appendChild(opt);
    });
}

function renderizarFiltrosBoutique() {
    const contenedor = document.getElementById("contenedor-filtros-categorias");
    if(!contenedor) return;
    let html = `<button class="filtro-btn activo" onclick="filtrarProductos('todos')">Todos</button>`;
    categoriasBoutique.forEach(cat => {
        html += `<button class="filtro-btn" onclick="filtrarProductos('${cat}')">${cat}</button>`;
    });
    contenedor.innerHTML = html;
}

function renderizarListaCategoriasAdmin() {
    const cont = document.getElementById("lista-categorias-admin");
    if(!cont) return;
    cont.innerHTML = `<b>Categorías activas:</b> ${categoriasBoutique.join(', ')}`;
}

function guardarHorariosMasivos() {
    const diasSeleccionados = Array.from(document.querySelectorAll('input[name="dias-admin"]:checked')).map(el => el.value);
    const horasSeleccionadas = Array.from(document.querySelectorAll('input[name="horas-admin"]:checked')).map(el => el.value);

    if (diasSeleccionados.length === 0 || horasSeleccionadas.length === 0) {
        alert("Selecciona al menos un día y una hora.");
        return;
    }

    diasSeleccionados.forEach(dia => {
        if (!agendaBarberia[dia]) agendaBarberia[dia] = [];
        horasSeleccionadas.forEach(hora => {
            if (!agendaBarberia[dia].includes(hora)) agendaBarberia[dia].push(hora);
        });
        agendaBarberia[dia].sort();
    });

    localStorage.setItem('agendaBarberia', JSON.stringify(agendaBarberia));
    actualizarSelectDiasCliente();
    actualizarListaAgendaAdmin();
    alert("¡Horarios habilitados con éxito!");
}

function limpiarAgendaAdmin() {
    if (confirm("¿Estás seguro de borrar toda la agenda?")) {
        agendaBarberia = {};
        localStorage.removeItem('agendaBarberia');
        actualizarSelectDiasCliente();
        actualizarListaAgendaAdmin();
    }
}

function actualizarSelectDiasCliente() {
    const select = document.getElementById("select-dia-cliente");
    if(!select) return;
    select.innerHTML = '<option value="">Selecciona un día...</option>';
    Object.keys(agendaBarberia).forEach(dia => {
        if(agendaBarberia[dia].length > 0) {
            const opt = document.createElement("option");
            opt.value = dia;
            opt.innerText = dia;
            select.appendChild(opt);
        }
    });
}

function mostrarHorasDelDia() {
    diaSeleccionado = document.getElementById("select-dia-cliente").value;
    const grid = document.getElementById("grid-horas");
    grid.innerHTML = "";
    document.getElementById("form-reserva").classList.add("oculto");

    if (!diaSeleccionado || !agendaBarberia[diaSeleccionado]) {
        grid.innerHTML = "<p style='color: var(--text-muted); font-size: 13px;'>Selecciona un día válido.</p>";
        return;
    }

    agendaBarberia[diaSeleccionado].forEach(hora => {
        const btn = document.createElement("div");
        btn.className = "hora-slot";
        btn.innerText = hora;
        btn.onclick = () => seleccionarHoraCita(diaSeleccionado, hora);
        grid.appendChild(btn);
    });
}

function seleccionarHoraCita(dia, hora) {
    horaSeleccionada = hora;
    document.getElementById("dia-seleccionado-txt").innerText = dia;
    document.getElementById("hora-seleccionada").innerText = hora;
    document.getElementById("form-reserva").classList.remove("oculto");
}

const btnEnviarCita = document.getElementById("btn-enviar-cita");
if (btnEnviarCita) {
    btnEnviarCita.addEventListener("click", () => {
        const nombre = document.getElementById("nombre-cliente").value;
        const telefono = document.getElementById("telefono-cliente").value;

        if (!nombre || !telefono) {
            alert("Completa tu nombre y teléfono.");
            return;
        }

        const mensaje = `Hola, quiero apartar una cita.%0A*Nombre:* ${nombre}%0A*Teléfono:* ${telefono}%0A*Día:* ${diaSeleccionado}%0A*Hora:* ${horaSeleccionada}`;
        window.open(`https://wa.me/573000000000?text=${mensaje}`, '_blank');
    });
}

function actualizarListaAgendaAdmin() {
    const contenedor = document.getElementById("lista-agenda-admin");
    if(!contenedor) return;
    contenedor.innerHTML = "<b>Días configurados:</b><br>";
    const dias = Object.keys(agendaBarberia);
    if(dias.length === 0) {
        contenedor.innerHTML += "No hay días habilitados.";
        return;
    }
    dias.forEach(dia => {
        contenedor.innerHTML += `- <b>${dia}</b>: [${agendaBarberia[dia].join(', ')}] <br>`;
    });
}

function subirProductoConCheckboxes() {
    const checkboxes = document.querySelectorAll('#grupo-checkboxes-tallas input[type="checkbox"]:checked');
    const tallasSeleccionadas = Array.from(checkboxes).map(cb => cb.value).join(', ');
    document.getElementById("prod-tallas").value = tallasSeleccionadas;
    subirProducto();
}

function subirProducto() {
    const nombre = document.getElementById("prod-nombre").value;
    const categoria = document.getElementById("prod-categoria").value;
    const precio = document.getElementById("prod-precio").value;
    const tallas = document.getElementById("prod-tallas").value || "Única";
    const caracteristicas = document.getElementById("prod-caracteristicas").value;
    const inputImagenes = document.getElementById("prod-imagenes");

    if (!nombre || !precio || inputImagenes.files.length === 0) {
        alert("Completa nombre, precio y selecciona imágenes.");
        return;
    }

    leerMultiplesImagenes(inputImagenes.files, (imagenesBase64) => {
        const nuevoProducto = {
            id: Date.now(),
            nombre,
            categoria,
            precio,
            tallas,
            caracteristicas,
            imagenes: imagenesBase64
        };
        productosBoutique.push(nuevoProducto);
        localStorage.setItem('productos', JSON.stringify(productosBoutique));
        
        renderizarProductos('todos');
        renderizarInventarioAdmin();
        alert("¡Artículo publicado con éxito!");

        document.getElementById("prod-nombre").value = "";
        document.getElementById("prod-precio").value = "";
        document.getElementById("prod-caracteristicas").value = "";
        inputImagenes.value = "";
        document.querySelectorAll('#grupo-checkboxes-tallas input[type="checkbox"]').forEach(cb => cb.checked = false);
    });
}

function leerMultiplesImagenes(files, callback) {
    let imagenes = [];
    let cargadas = 0;
    Array.from(files).forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            imagenes[index] = e.target.result;
            cargadas++;
            if (cargadas === files.length) callback(imagenes);
        };
        reader.readAsDataURL(file);
    });
}

function abrirModalDetalle(id) {
    const prod = productosBoutique.find(p => p.id == id);
    if (!prod) return;
    productoActualDetalle = prod;

    document.getElementById("detalle-titulo").innerText = prod.nombre;
    document.getElementById("detalle-precio").innerText = `$${prod.precio}`;
    document.getElementById("detalle-caracteristicas").innerText = prod.caracteristicas || "Sin descripción.";

    const imgPrincipal = document.getElementById("detalle-img-principal");
    const contenedorMinis = document.getElementById("detalle-minis");
    contenedorMinis.innerHTML = "";

    if (prod.imagenes && prod.imagenes.length > 0) {
        imgPrincipal.src = prod.imagenes[0];
        prod.imagenes.forEach(imgSrc => {
            const min = document.createElement("img");
            min.src = imgSrc;
            min.onclick = () => imgPrincipal.src = imgSrc;
            contenedorMinis.appendChild(min);
        });
    }

    const selectTallas = document.getElementById("detalle-select-talla");
    selectTallas.innerHTML = "";
    const opciones = prod.tallas ? prod.tallas.split(',') : ['Única'];
    opciones.forEach(op => {
        const opt = document.createElement("option");
        opt.value = op.trim();
        opt.innerText = op.trim();
        selectTallas.appendChild(opt);
    });

    document.getElementById("modal-detalle").classList.remove("oculto");
}

function cerrarModalDetalle() {
    document.getElementById("modal-detalle").classList.add("oculto");
}

const btnAgregarDetalle = document.getElementById("btn-agregar-desde-detalle");
if (btnAgregarDetalle) {
    btnAgregarDetalle.onclick = function() {
        if (!productoActualDetalle) return;
        const tallaSeleccionada = document.getElementById("detalle-select-talla").value;

        const itemExistente = carrito.find(item => item.id == productoActualDetalle.id && item.tallaSeleccionada == tallaSeleccionada);
        if (itemExistente) {
            itemExistente.cantidad += 1;
        } else {
            carrito.push({
                id: productoActualDetalle.id,
                nombre: productoActualDetalle.nombre,
                precio: productoActualDetalle.precio,
                imagen: productoActualDetalle.imagenes[0],
                tallaSeleccionada,
                cantidad: 1
            });
        }

        localStorage.setItem('carrito', JSON.stringify(carrito));
        actualizarContadorCarrito();
        cerrarModalDetalle();
        alert("¡Producto añadido al carrito!");
    };
}

function eliminarProducto(id) {
    if (confirm("¿Estás seguro de eliminar este artículo?")) {
        productosBoutique = productosBoutique.filter(p => p.id != id);
        localStorage.setItem('productos', JSON.stringify(productosBoutique));
        renderizarProductos('todos');
        renderizarInventarioAdmin();
    }
}

function actualizarContadorCarrito() {
    const contador = document.getElementById("contador-carrito");
    if(!contador) return;
    contador.innerText = carrito.reduce((sum, item) => sum + item.cantidad, 0);
}

function toggleCarritoModal() {
    const modal = document.getElementById("modal-carrito");
    modal.classList.toggle("oculto");
    if (!modal.classList.contains("oculto")) renderizarItemsCarrito();
}

function renderizarItemsCarrito() {
    const contenedor = document.getElementById("lista-items-carrito");
    if(!contenedor) return;
    contenedor.innerHTML = "";

    if (carrito.length === 0) {
        contenedor.innerHTML = "<p style='color: var(--text-muted); text-align: center; padding: 20px;'>Tu carrito está vacío.</p>";
        document.getElementById("carrito-total-precio").innerText = "$0";
        return;
    }

    let totalGlobal = 0;
    carrito.forEach((item, index) => {
        totalGlobal += (item.precio * item.cantidad);
        const div = document.createElement("div");
        div.className = "carrito-item";
        div.innerHTML = `
            <div class="carrito-item-info">
                <strong>${item.nombre}</strong>
                <span>Opción: ${item.tallaSeleccionada} | $${item.precio} x ${item.cantidad}</span>
            </div>
            <div class="carrito-item-controles">
                <button onclick="cambiarCantidad(${index}, -1)">-</button>
                <span>${item.cantidad}</span>
                <button onclick="cambiarCantidad(${index}, 1)">+</button>
                <button onclick="eliminarDelCarrito(${index})" style="background: var(--danger); margin-left: 8px;">🗑️</button>
            </div>
        `;
        contenedor.appendChild(div);
    });

    document.getElementById("carrito-total-precio").innerText = `$${totalGlobal}`;
}

function cambiarCantidad(index, cambio) {
    carrito[index].cantidad += cambio;
    if (carrito[index].cantidad <= 0) carrito.splice(index, 1);
    localStorage.setItem('carrito', JSON.stringify(carrito));
    actualizarContadorCarrito();
    renderizarItemsCarrito();
}

function eliminarDelCarrito(index) {
    carrito.splice(index, 1);
    localStorage.setItem('carrito', JSON.stringify(carrito));
    actualizarContadorCarrito();
    renderizarItemsCarrito();
}

function enviarPedidoWhatsApp() {
    const nombre = document.getElementById("nombre-comprador").value;
    const telefono = document.getElementById("telefono-comprador").value;

    if (!nombre || !telefono || carrito.length === 0) {
        alert("Completa tu nombre, teléfono y asegúrate de tener productos en el carrito.");
        return;
    }

    let detallePedido = `Hola, quiero hacer un pedido:%0A*Cliente:* ${nombre}%0A*Teléfono:* ${telefono}%0A*Artículos:*%0A`;
    let total = 0;

    carrito.forEach(item => {
        total += (item.precio * item.cantidad);
        detallePedido += `- ${item.cantidad}x ${item.nombre} (${item.tallaSeleccionada}) - $${item.precio} c/u%0A`;
    });

    detallePedido += `%0A*Total a Pagar:* $${total}`;
    window.open(`https://wa.me/573000000000?text=${detallePedido}`, '_blank');
}

function renderizarProductos(categoriaFiltro) {
    const contenedor = document.getElementById("catalogo-productos");
    if(!contenedor) return;
    contenedor.innerHTML = "";
    const filtrados = categoriaFiltro === 'todos' ? productosBoutique : productosBoutique.filter(p => p.categoria === categoriaFiltro);

    if(filtrados.length === 0) {
        contenedor.innerHTML = "<p style='color: var(--text-muted); grid-column: 1/-1;'>No hay artículos disponibles.</p>";
        return;
    }

    filtrados.forEach(prod => {
        const tarjeta = document.createElement("div");
        tarjeta.className = "producto-card";
        tarjeta.onclick = () => abrirModalDetalle(prod.id);
        const imgPortada = prod.imagenes && prod.imagenes.length > 0 ? prod.imagenes[0] : '';
        
        tarjeta.innerHTML = `
            <div>
                <img src="${imgPortada}" alt="${prod.nombre}">
                <div class="producto-info">
                    <h4>${prod.nombre}</h4>
                    <div class="producto-precio">$${prod.precio}</div>
                </div>
            </div>
            <button class="btn-primary" style="border-radius: 0;" onclick="event.stopPropagation(); abrirModalDetalle(${prod.id});">Ver Detalles y Comprar</button>
        `;
        contenedor.appendChild(tarjeta);
    });
}

function renderizarInventarioAdmin() {
    const contenedor = document.getElementById("lista-inventario-admin");
    if(!contenedor) return;
    contenedor.innerHTML = "";

    if(productosBoutique.length === 0) {
        contenedor.innerHTML = "<p style='color: var(--text-muted);'>No hay productos registrados.</p>";
        return;
    }

    productosBoutique.forEach(prod => {
        const imgPortada = prod.imagenes && prod.imagenes.length > 0 ? prod.imagenes[0] : '';
        const tarjeta = document.createElement("div");
        tarjeta.className = "producto-card";
        tarjeta.innerHTML = `
            <div>
                <img src="${imgPortada}" alt="${prod.nombre}">
                <div class="producto-info">
                    <h4>${prod.nombre}</h4>
                    <div class="producto-precio">$${prod.precio} (${prod.categoria})</div>
                </div>
            </div>
            <div class="admin-acciones" style="margin-top: 10px;">
                <button class="btn-eliminar" onclick="eliminarProducto(${prod.id})">Eliminar</button>
            </div>
        `;
        contenedor.appendChild(tarjeta);
    });
}

function filtrarProductos(categoria) {
    const botones = document.querySelectorAll('.filtro-btn');
    botones.forEach(btn => btn.classList.remove('activo'));
    if(event) event.target.classList.add('activo');
    renderizarProductos(categoria);
}
