
// Recursos
const express = require('express');
const path = require('path');
const ejs = require('ejs');
const config = require('./package.json');
const morgan = require('morgan');
const mongoose = require('mongoose');
const { Schema, model } = require('mongoose')
const port = process.env.PORT || 3000;
const cookieParser = require('cookie-parser');

let app = express();

// Database

mongoose.connect(config.dbtoken, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Conexión con la base de datos establecida con éxito.')
}).catch((error) => {
  console.log('No fue posible establecer conexíón con la base de datos.')
  console.log(error)
})

let ghjghj = new Schema({
  userName: String,
  userPassword: String,
  userMail: String,
  userNotes: String,
  userNotesReceived: String
})


const userModel = model('ModeloDeUsuario', ghjghj);



// Middlewares

app.use(express.urlencoded());
app.use(express.json());
app.use(express.text());
app.use(cookieParser());
app.use('/views', express.static(path.join(__dirname, '/views')))
app.use((req, res, next) => {
	res.setHeader('X-Content-Type-Options', 'nosniff');
	next()
});
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));



// Routes






app.post('/editNote-2', async (req, res) => {
	let userRequested = await userModel.findOne({ userMail: req.query.email });
	let noteJSON = {
		title: req.body.title,
		body: req.body.body
	}
	let previousNotesObj = JSON.parse(userRequested.userNotes);
	let newArray = previousNotesObj.map(element => {
		if (element.title == req.query.title) {
			let newElement = {
				title: req.body.title,
				body: req.body.body
			}
			return newElement
		} else return element;
	});
	let newArrayString = JSON.stringify(newArray);
	await userModel.findOneAndUpdate({ userMail: req.query.email }, { userNotes: newArrayString });
	res.redirect(`/notes?email=${req.query.email}`)
});
app.post('/editNote', async (req, res) => {
	let userRequested = await userModel.findOne({ userMail: req.query.email })
	let array = JSON.parse(userRequested.userNotes);
	let note = array.filter(element => element.title == req.query.nota);
	res.render('editNote', { email: req.query.email, nota: note[0] });
});
app.post('/deleteNote', async (req, res) => {
	let userRequested = await userModel.findOne({ userMail: req.query.email });
	let previousNotesObj = JSON.parse(userRequested.userNotes);
	let newObj = previousNotesObj.filter(element => element.title !== req.query.nota)
	let newString = JSON.stringify(newObj);
	await userModel.findOneAndUpdate({ userMail: req.query.email }, { userNotes: newString });
	res.redirect(`/notes?email=${req.query.email}`);
});
app.get('/notes', async (req, res) => {
	let userRequested = await userModel.findOne({ userMail: req.query.email });
	let notes = JSON.parse(userRequested.userNotes)
	res.render('notes', { email: req.query.email, notes });
});
app.post('/createNote', async (req, res) => {
	let userRequested = await userModel.findOne({ userMail: req.query.email });
	if (!userRequested.userNotes) {
		let notesArray = [
				{
					title: req.body.title,
					body: req.body.body
				}
			]
		let notesString = JSON.stringify(notesArray);
		await userModel.findOneAndUpdate({ userMail: req.query.email }, { userNotes: notesString });
		res.redirect(`/notes?email=${req.query.email}`);
	} else {
		let notesArray = JSON.parse(userRequested.userNotes);
		let notesObj = {
			title: req.body.title,
			body: req.body.body
		};
		notesArray.push(notesObj);
		let notesString = JSON.stringify(notesArray);
		await userModel.findOneAndUpdate({ userMail: req.query.email }, { userNotes: notesString });
		res.redirect(`/notes?email=${req.query.email}`);
	}
});
app.get('/createNote/:email', (req, res) => {
	try {
		res.render('createNote', { email: req.params.email });
	} catch (err) {
		console.error(err);
		res.send('Algo salió mal.')
	}
});
app.get('/login', async (req, res) => {
	try {
		let userRequested = await userModel.findOne({ userMail: req.query.email });
		if (!userRequested.userPassword === req.cookies.password) {
			res.clearCookie('password');
			res.send('Inicia sesión de nuevo, por favor.');
		} else {
			if (!userRequested.userNotes) return res.redirect(`/createNote/${req.query.email}`);
			res.redirect(`/notes?email=${req.query.email}`);
		}
	} catch (err) {
		console.log(err);
		res.send('Ha ocurrido un error');
	}
});
app.post('/login', async (req, res) => {
	try {
		if (!req.body.emailAddress || !req.body.password) return res.send('Debes escribir los datos para ingresar.');
		let userRequested = await userModel.findOne({ userMail: req.body.emailAddress });
		if (userRequested.userPassword === req.body.password) {
			res.cookie('password', req.body.password, { maxAge: 900000 });
			res.redirect(`/login?email=${req.body.emailAddress}`);
		} else return res.send('Los datos ingresados son incorrectos.');
	} catch (err) {
		console.error(err);
		res.send('Ha ocurrido un error.');
	}
});
app.get('/signup', (req, res) => {
	res.render('signUp');
});
app.post('/signup', async (req, res) => {
	let user = await userModel.findOne({ userMail: req.body.emailAddress });
	if (!user) {
		try {
			await userModel.create({ userMail: req.body.emailAddress, userName: req.body.user, userPassword: req.body.password });
			res.redirect('/');
		} catch (err) {
			console.err(err)
			res.send('Ha ocurrido un error, inténtelo de nuevo');
		}
	} else {
		res.send('Algo salió mal. Es posible que ese email ya esté registrado.')
	}
});
app.get('/', (req, res) => {
	res.render('home');
});
app.listen(port, () => {
	try {
		console.log(`La aplicación se está ejecutando en el puerto ${port}`);
	} catch (err) {
		console.error(err);
	}
});