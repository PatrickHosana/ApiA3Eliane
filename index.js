const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors({ origin: true }));
require('dotenv').config();

app.use(express.json());

const serviceAccount = {
    type: process.env.TYPE,
    project_id: process.env.PROJECT_ID,
    private_key_id: process.env.PRIVATE_KEY_ID,
    private_key: process.env.PRIVATE_KEY.replace(/\n/g, '\n'),
    client_email: process.env.CLIENT_EMAIL,
    client_id: process.env.CLIENT_ID,
    auth_uri: process.env.AUTH_URI,
    token_uri: process.env.TOKEN_URI,
    auth_provider_x509_cert_url: process.env.AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.CLIENT_X509_CERT_URL,
};

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://${process.env.PROJECT_ID}.firebaseio.com`,
});

const db = admin.firestore();

// Criar Usuarios
app.post('/api/create/users', (req, res) => {
    (async () => {
        try {
            await db.collection('users').doc('/' + req.body.user_id + '/')
                .create({
                    user_email: req.body.user_email,
                    user_img: req.body.user_img,
                    user_nome: req.body.user_nome,
                    user_senha: req.body.user_senha,
                });
            return res.status(200).send();
        } catch (error) {
            console.log(error);
            return res.status(500).send(error);
        }
    })();
});

// Ler usuario especifico
app.get('/api/readitem/users/:user_id', (req, res) => {
    (async () => {
        try {
            const document = db.collection('users').doc(req.params.user_id);
            let item = await document.get();
            let response = item.data();
            return res.status(200).send(response);
        } catch (error) {
            console.log(error);
            return res.status(500).send(error);
        }
    })();
});

// Ler todos os usuarios
app.get('/api/readall/users', (req, res) => {
    (async () => {
        try {
            let query = db.collection('users');
            let response = [];
            await query.get().then(querySnapshot => {
                let docs = querySnapshot.docs;
                for (let doc of docs) {
                    const selectedItem = {
                        user_id: doc.user_id,
                        user_email: doc.data().user_email,
                        user_img: doc.data().user_img,
                        user_nome: doc.data().user_nome,
                        user_senha: doc.data().user_senha,
                    };
                    response.push(selectedItem);
                }
            });
            return res.status(200).send(response);
        } catch (error) {
            console.log(error);
            return res.status(500).send(error);
        }
    })();
});

// Update
app.put('/api/update/users/:user_id', (req, res) => {
    (async () => {
        try {
            const document = db.collection('users').doc(req.params.user_id);
            await document.update({
                user_email: req.body.user_email,
                user_img: req.body.user_img,
                user_nome: req.body.user_nome,
                user_senha: req.body.user_senha,
            });
            return res.status(200).send();
        } catch (error) {
            console.log(error);
            return res.status(500).send(error);
        }
    })();
});

// Delete usuarios
app.delete('/api/delete/users/:user_id', (req, res) => {
    (async () => {
        try {
            const document = db.collection('users').doc(req.params.user_id);
            await document.delete();
            return res.status(200).send();
        } catch (error) {
            console.log(error);
            return res.status(500).send(error);
        }
    })();
});

// Criar Posts
app.post('/api/create/posts', (req, res) => {
    (async () => {
        try {
            // Validação de campos obrigatórios
            const requiredFields = [
                'nome_prato',
                'genero_prato',
                'mode_preparo',
                'nivel_dificuldade',
                'nome_ingredientes',
                'quantidade_porcao',
                'tempo_preparo',
            ];

            for (const field of requiredFields) {
                if (!req.body[field]) {
                    return res.status(400).json({ error: `Campo obrigatório '${field}' não foi fornecido.` });
                }
            }

            // Verificação para campos opcionais
            const data = {
                nome_prato: req.body.nome_prato,
                genero_prato: req.body.genero_prato,
                mode_preparo: req.body.mode_preparo,
                nivel_dificuldade: req.body.nivel_dificuldade,
                nome_ingredientes: req.body.nome_ingredientes,
                quantidade_porcao: req.body.quantidade_porcao,
                tempo_preparo: req.body.tempo_preparo,
                img_post: req.body.img_post || null, // Define como null se não for fornecido
            };

            // Criar documento no Firestore
            await db.collection('posts').doc('/' + req.body.post_id + '/').create(data);

            return res.status(200).json({ message: 'Post criado com sucesso!' });
        } catch (error) {
            console.error('Erro ao criar post:', error);
            return res.status(500).json({ error: 'Erro ao salvar os dados no banco.' });
        }
    })();
});


// Ler post especifico
app.get('/api/readitem/posts/:post_id', (req, res) => {
    (async () => {
        try {
            const document = db.collection('posts').doc(req.params.post_id);
            let item = await document.get();
            let response = item.data();
            return res.status(200).send(response);
        } catch (error) {
            console.log(error);
            return res.status(500).send(error);
        }
    })();
});

// Ler todos os posts
app.get('/api/readall/posts', (req, res) => {
    (async () => {
        try {
            let query = db.collection('posts');
            let response = [];
            await query.get().then(querySnapshot => {
                let docs = querySnapshot.docs;
                for (let doc of docs) {
                    const selectedItem = {
                        post_id: doc.post_id,
                        genero_prato: doc.data().genero_prato,
                        mode_preparo: doc.data().mode_preparo,
                        nivel_dificuldade: doc.data().nivel_dificuldade,
                        nome_ingredientes: doc.data().nome_ingredientes,
                        nome_prato: doc.data().nome_prato,
                        quantidade_porcao: doc.data().quantidade_porcao,
                        tempo_preparo: doc.data().tempo_preparo,
                        img_post: doc.data().img_post,
                    };
                    response.push(selectedItem);
                }
            });
            return res.status(200).send(response);
        } catch (error) {
            console.log(error);
            return res.status(500).send(error);
        }
    })();
});

// Update post
app.put('/api/update/posts/:post_id', (req, res) => {
    (async () => {
        try {
            const document = db.collection('posts').doc(req.params.post_id);
            await document.update({
                nome_prato: req.body.nome_prato,
                genero_prato: req.body.genero_prato,
                mode_preparo: req.body.mode_preparo,
                nivel_dificuldade: req.body.nivel_dificuldade,
                nome_ingredientes: req.body.nome_ingredientes,
                quantidade_porcao: req.body.quantidade_porcao,
                tempo_preparo: req.body.tempo_preparo,
                img_post: req.body.post_img,
            });
            return res.status(200).send();
        } catch (error) {
            console.log(error);
            return res.status(500).send(error);
        }
    })();
});

// Delete post
app.delete('/api/delete/posts/:post_id', (req, res) => {
    (async () => {
        try {
            const document = db.collection('posts').doc(req.params.post_id);
            await document.delete();
            return res.status(200).send();
        } catch (error) {
            console.log(error);
            return res.status(500).send(error);
        }
    })();
});

app.listen(3030, () => console.log("Server Rodando"));