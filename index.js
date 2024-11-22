const functions = require('firebase-functions');
admin = require('firebase-admin');
express = require('express');
cors = require('cors');
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
    .create({   user_bio: req.body.user_bio,
                user_date:req.body.user_date,
                user_email:req.body.user_email,
                user_fav:req.body.user_fav,
                user_genero:req.body.user_genero,
                user_img:req.body.user_img,
                user_loc:req.body.user_loc,
                user_nome:req.body.user_nome,
                user_senha:req.body.user_senha
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
    user_bio: doc.data().user_bio,
    user_date:doc.data().user_date,
    user_email:doc.data().user_email,
    user_fav:doc.data().user_fav,
    user_genero:doc.data().user_genero,
    user_img:doc.data().user_img,
    user_loc:doc.data().user_loc,
    user_nome:doc.data().user_nome,
    user_senha:doc.data().user_senha
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

    // update
app.put('/api/update/users/:user_id', (req, res) => {
    (async () => {
    try {
    const document = db.collection('users').doc(req.params.user_id);
    await document.update({
        user_bio: req.body.user_bio,
        user_date:req.body.user_date,
        user_email:req.body.user_email,
        user_fav:req.body.user_fav,
        user_genero:req.body.user_genero,
        user_img:req.body.user_img,
        user_loc:req.body.user_loc,
        user_nome:req.body.user_nome,
        user_senha:req.body.user_senha
    });
    return res.status(200).send();
    } catch (error) {
    console.log(error);
    return res.status(500).send(error);
    }
    })();
    });

    // delete usuarios
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
    await db.collection('posts').doc('/' + req.body.post_id + '/')
    .create({   
// preenchidos pelo usuário
        nome_prato:req.body.nome_prato,
        genero_prato: req.body.genero_prato,
        mode_preparo:req.body.mode_preparo,
        nivel_dificuldade:req.body.nivel_dificuldade,
        nome_ingredientes:req.body.nome_ingredientes,
        quantidade_porcao:req.body.quantidade_porcao,
        tempo_preparo:req.body.tempo_preparo,

            });
    return res.status(200).send();
    } catch (error) {
    console.log(error);
    return res.status(500).send(error);
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
    mode_preparo:doc.data().mode_preparo,
    nivel_dificuldade:doc.data().nivel_dificuldade,
    nome_ingredientes:doc.data().nome_ingredientes,
    nome_prato:doc.data().nome_prato,
    quantidade_porcao:doc.data().quantidade_porcao,
    tempo_preparo:doc.data().tempo_preparo,
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

    // update post
app.put('/api/update/posts/:post_id', (req, res) => {
    (async () => {
    try {
    const document = db.collection('posts').doc(req.params.post_id);
    await document.update({
        // preenchidos pelo usuário
        nome_prato:req.body.nome_prato,
        genero_prato: req.body.genero_prato,
        mode_preparo:req.body.mode_preparo,
        nivel_dificuldade:req.body.nivel_dificuldade,
        nome_ingredientes:req.body.nome_ingredientes,
        quantidade_porcao:req.body.quantidade_porcao,
        tempo_preparo:req.body.tempo_preparo
    });
    return res.status(200).send();
    } catch (error) {
    console.log(error);
    return res.status(500).send(error);
    }
    })();
    });

    // delete post
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


    app.listen(3030,()=>console.log("Server Rodando"));