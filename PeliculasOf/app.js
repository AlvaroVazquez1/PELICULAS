//original
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const ejs = require('ejs');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Conexión a la base de datos
mongoose.connect('mongodb://localhost:27017/Proyecto');

// Definición del esquema de usuario
const usuarioSchema = new mongoose.Schema({
    nombre: String,
    edad: Number,
    tipo: String,
    password: String
});

// Modelo de usuario
const Usuario = mongoose.model('Users', usuarioSchema);

// Definición del esquema de película
const movieSchema = mongoose.Schema({
    nombre: String,
    año: Number,
    director: String,
    actores: [String],
    img: String
});

// Modelo de película
const Pelicula = mongoose.model('Peliculas', movieSchema);

// Ruta para manejar el inicio de sesión
app.get('/login', (req, res) => {
    const isAdmin = req.user && req.user.tipo === 'Administrador';
    res.render('login.ejs', { isAdmin: isAdmin });
});

app.post('/login', async (req, res) => {
    const { nombreUsuario, contraseña } = req.body;
    try {
        const usuario = await Usuario.findOne({ nombre: nombreUsuario });
        if (!usuario || usuario.password !== contraseña) {
            return res.status(401).send('Nombre de usuario o contraseña incorrectos');
        }
        // Aquí podrías iniciar sesión de alguna manera (por ejemplo, utilizando cookies o sesiones)
        res.redirect('/Peliculas');
    } catch (error) {
        res.status(500).send('Error al iniciar sesión');
    }
});

// Ruta para mostrar el listado de películas y manejar la eliminación de películas
app.get('/Peliculas', async (req, res) => {
    try {
        const peliculas = await Pelicula.find();
        const isAdmin = req.user && req.user.tipo === 'Administrador';
        res.render('peliculas.ejs', { Peliculas: peliculas, isAdmin: isAdmin });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Ruta para mostrar el formulario de agregar película
app.get('/Peliculas/agregar', (req, res) => {
    res.render('agregar.ejs');
});

// Ruta para agregar una nueva película
app.post('/Peliculas/agregar', async (req, res) => {
    // Aquí deberías tener el código para guardar la nueva película en la base de datos
    // Por ejemplo:
    const nuevaPelicula = new Pelicula({
        nombre: req.body.nombre,
        año: req.body.año,
        director: req.body.director,
        actores: req.body.actores.split(','),
        img: req.body.img
    });
    try {
        await nuevaPelicula.save();
        res.redirect('/Peliculas');
    } catch (error) {
        res.status(500).send('Error al agregar la película');
    }
});

// Ruta para mostrar el formulario de registro de usuario
app.get('/addUser', (req, res) => {
    res.render('addUser.ejs');
});

// Ruta para agregar un nuevo usuario
app.post('/addUser', async (req, res) => {
    // Aquí deberías tener el código para guardar el nuevo usuario en la base de datos
    // Por ejemplo:
    const nuevoUsuario = new Usuario({
        nombre: req.body.nombreUsuario,
        edad: req.body.edad,
        tipo: req.body.tipo,
        password: req.body.password
    });
    try {
        await nuevoUsuario.save();
        res.redirect('/login');
    } catch (error) {
        res.status(500).send('Error al agregar el usuario');
    }
});

// Ruta para borrar una película por su ID
app.post('/Peliculas/:id', async (req, res) => {
    if (req.query._method === 'DELETE') {
        const peliculaId = req.params.id;
        try {
            await Pelicula.findByIdAndDelete(peliculaId);
            res.redirect('/Peliculas');
        } catch (error) {
            res.status(500).send('Error al borrar la película');
        }
    } else {
        // Cualquier otra lógica que necesites aquí
    }
});

// Ruta para buscar películas por nombre
app.get('/Peliculas/buscar', async (req, res) => {
    try {
        const query = req.query.query;
        const peliculas = await Pelicula.find({
            $or: [
                { nombre: { $regex: new RegExp(query, 'i') } },
                { año: parseInt(query) || 0 },
                { director: { $regex: new RegExp(query, 'i') } },
                { actores: { $regex: new RegExp(query, 'i') } }
            ]
        });
        res.render('peliculas.ejs', { Peliculas: peliculas });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Configuración del motor de plantillas EJS
app.set('view engine', 'ejs');

// Manejo de errores de conexión a la base de datos
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Error de conexión a MongoDB:'));
db.once('open', function () {
    console.log('Conexión exitosa a MongoDB');
});

// Inicio del servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});
