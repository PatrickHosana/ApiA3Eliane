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

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: `https://${process.env.PROJECT_ID}.firebaseio.com`,
    });
} else {
    console.log('Firebase já foi inicializado');
}

const db = admin.firestore();

// Middleware para verificar o token JWT
function authenticateToken(req, res, next) {
    const token = req.headers[npm install nodemailer'authorization']?.split(' ')[1]; // Ex: "Bearer <token>"

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

// Login
app.post('/api/login', async (req, res) => {
    const { user_email, user_senha } = req.body;

    if (!user_email || !user_senha) {
        console.log('Email ou senha não fornecidos');
        return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
    }

    try {
        console.log('Buscando usuário no Firestore');
        const userDoc = await db.collection('users').where('user_email', '==', user_email).limit(1).get();

        if (userDoc.empty) {
            console.log('Usuário não encontrado');
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        const user = userDoc.docs[0].data();
        console.log('Senha armazenada no banco:', user.user_senha);

        const isPasswordValid = await bcrypt.compare(user_senha, user.user_senha);

        if (!isPasswordValid) {
            console.log('Senha inválida');
            return res.status(401).json({ message: 'Senha inválida.' });
        }

        // Gerar o token JWT
        const token = jwt.sign(
            { user_email: user_email, user_id: userDoc.docs[0].id },  // Dados do usuário que você quer incluir no token
            process.env.JWT_SECRET, // Usando a variável de ambiente JWT_SECRET
            { expiresIn: '1h' } // O token expira em 1 hora
        );
        console.log('Login bem-sucedido, token gerado');
        return res.status(200).json({ message: 'Login bem-sucedido', token });
    } catch (error) {
        console.error('Erro ao tentar logar:', error);
        return res.status(500).json({ message: 'Erro ao tentar conectar com o servidor.', error: error.message });
    }
});

// Criar Usuário
app.post('/api/create/users', async (req, res) => {
    const { user_email, user_nome, user_senha, user_img } = req.body;

    if (!user_email || !user_nome || !user_senha) {
        console.log('Campos obrigatórios não fornecidos');
        return res.status(400).json({ message: 'Campos obrigatórios não fornecidos.' });
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(user_senha, salt);

        const newUser = {
            user_email,
            user_nome,
            user_senha: hashedPassword,
            user_img: user_img || null,
        };

        const docRef = await db.collection('users').add(newUser);
        console.log('Usuário criado com sucesso');
        return res.status(201).json({ message: 'Usuário criado com sucesso', user_id: docRef.id });
    } catch (error) {
        console.error('Erro ao criar usuário:', error);
        return res.status(500).json({ message: 'Erro ao criar usuário', error: error.message });
    }
});

// Ler usuário específico
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

// Ler todos os usuários
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

// Update Usuário
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

// Delete Usuário
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

// Ler post específico
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
                        nome_prato: doc.data().nome_prato,
                        genero_prato: doc.data().genero_prato,
                        mode_preparo: doc.data().mode_preparo,
                        nivel_dificuldade: doc.data().nivel_dificuldade,
                        nome_ingredientes: doc.data().nome_ingredientes,
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

// Update Post
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
            });
            return res.status(200).send();
        } catch (error) {
            console.log(error);
            return res.status(500).send(error);
        }
    })();
});

// Delete Post
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
const nodemailer = require('nodemailer');

// Configuração do transporte de e-mail (usando seu serviço de e-mail)
const transporter = nodemailer.createTransport({
    service: 'gmail',  // Ou o serviço que você estiver usando
    auth: {
        user: process.env.EMAIL_USER, // E-mail que enviará a mensagem
        pass: process.env.EMAIL_PASS, // Senha do e-mail
    },
});

app.post('/api/forgot-password', async (req, res) => {
    const { user_email } = req.body;

    if (!user_email) {
        return res.status(400).json({ message: 'Email não fornecido.' });
    }

    try {
        // Gerar link de redefinição de senha
        const auth = admin.auth();
        const resetLink = await auth.generatePasswordResetLink(user_email);
    
        // Configurar o e-mail de recuperação
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user_email,
            subject: 'Recuperação de Senha',
            html: `
                <h1>Redefinição de Senha</h1>
                <p>Olá, clique no link abaixo para redefinir sua senha:</p>
                <a href="${resetLink}">Redefinir senha</a>
            `,
        };
    
        // Enviar o e-mail
        await transporter.sendMail(mailOptions);
        console.log(`E-mail enviado para ${user_email}`); // Log para verificação
    
        return res.status(200).json({ message: 'E-mail de recuperação de senha enviado com sucesso.' });
    } catch (error) {
        console.error('Erro ao enviar e-mail de recuperação de senha:', error);
        return res.status(500).json({ message: 'Erro ao enviar o e-mail de recuperação de senha.', error: error.message });
    }
    
});



// Iniciar o servidor
app.listen(3030, () => console.log("Server Rodando"));
