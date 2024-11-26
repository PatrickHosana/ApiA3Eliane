const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
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

// Middleware para verificar o token JWT
function authenticateToken(req, res, next) {
    const token = req.headers['authorization']?.split(' ')[1]; // Ex: "Bearer <token>"

    if (!token) {
        return res.status(401).json({ message: 'Token não fornecido' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Token inválido' });
        }
        req.user = user; // Coloca os dados do usuário no req.user
        next();
    });
}

// Criar Usuários
app.post('/api/create/users', async (req, res) => {
    try {
        // Criptografa a senha antes de salvar no Firestore
        const hashedPassword = await bcrypt.hash(req.body.user_senha, 10);
        console.log("Senha criptografada:", hashedPassword);  // Log para verificar a senha

        await db.collection('users').doc('/' + req.body.user_id + '/').create({
            user_email: req.body.user_email,
            user_img: req.body.user_img,
            user_nome: req.body.user_nome,
            user_senha: hashedPassword,  // Senha criptografada
        });

        return res.status(200).json({
            message: 'Usuário criado com sucesso!',
            user_id: req.body.user_id,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            error: 'Erro ao criar usuário',
            details: error.message,
        });
    }
});

// Login
app.post('/api/login', async (req, res) => {
    const { user_email, user_senha } = req.body;

    // Verifica se os campos de email e senha foram fornecidos
    if (!user_email || !user_senha) {
        return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
    }

    try {
        // Busca o usuário no Firestore pelo email
        const userDoc = await db.collection('users').where('user_email', '==', user_email).limit(1).get();

        if (userDoc.empty) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        // Pega os dados do usuário
        const user = userDoc.docs[0].data();

        // Log para ver a senha criptografada armazenada
        console.log("Senha armazenada no banco:", user.user_senha);

        // Verifica se a senha fornecida corresponde à senha armazenada
        const isPasswordValid = await bcrypt.compare(user_senha, user.user_senha);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Senha inválida.' });
        }

        // Gera o token JWT
        const token = jwt.sign({ user_email: user_email, user_id: userDoc.docs[0].id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // Retorna o token para o cliente
        return res.status(200).json({ message: 'Login bem-sucedido', token });
    } catch (error) {
        console.error('Erro ao tentar logar:', error);
        return res.status(500).json({ message: 'Erro ao tentar conectar com o servidor.', error: error.message });
    }
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
                        user_id: doc.data().user_id,
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

// Criar Post
app.post('/api/create/posts', (req, res) => {
    (async () => {
        try {
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

            const data = {
                nome_prato: req.body.nome_prato,
                genero_prato: req.body.genero_prato,
                mode_preparo: req.body.mode_preparo,
                nivel_dificuldade: req.body.nivel_dificuldade,
                nome_ingredientes: req.body.nome_ingredientes,
                quantidade_porcao: req.body.quantidade_porcao,
                tempo_preparo: req.body.tempo_preparo,
                img_post: req.body.img_post || null,
            };

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
                        post_id: doc.data().post_id,
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
                img_post: req.body.img_post,
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
