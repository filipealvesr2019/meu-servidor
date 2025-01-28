const express = require("express");
const app = express();
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
require("dotenv").config();
const Usuario = require('./models/Usuario')

app.use(express.json());
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Rota que lança um erro

app.get("/erro", (req, res) => {
  throw new Error("Erro simulado!");
});

app.use((err, req, res, next) => {
  console.log(err.stack);
  res.status(500).send("Algo deu errado no banco de dados");
});

app.get("/", (req, res) => {
  res.send("Servidor Express.js esta rodando");
});
const protegerRota = (req, res, next) => {
  const token = req.headers["authorization"];
  if (token === "token-de-acesso") {
    next();
  } else {
    res.status(403).send("Acesso negado token invalido!");
  }
};
app.get("/rota-protegida", protegerRota, (req, res) => {
  res.send("Voce acessou uma rota protegida");
});

const logProdutoMiddleware = (req, res, next) => {
  console.log("Produto foi acessado....");
  next();
};

app.get("/produtos", logProdutoMiddleware, (req, res) => {
  res.send("Lista de Produtos");
});

app.get("/sobre", (req, res) => {
  res.send("Pagina sobre Nos");
});

// http://localhost:3000/adicionar-produto

app.post("/adicionar-produto", (req, res) => {
  const produto = req.body;
  if (!produto.nome || !produto.preco) {
    console.log("campos sao necessarios ");
  }
  try {
    res.send(`Produto ${produto.nome} adicionado com sucesso!`);
  } catch (error) {
    console.log(error);
  }
});

app.post("/criar-usuario", async (req, res) => {
  const { nome, email, senha } = req.body;

  try {
   // gera o salt
   

    const senhaHash = await bcrypt.hash(senha, 10);

    const novoUsuario = new Usuario({
      nome,
      email,
      senha: senhaHash,
    });

    await novoUsuario.save();

    res.status(201).send({ message: "Usuario criado com sucesso!" });
  } catch (error) {
    console.log(error);
  }
});

app.post(`/login`, async (req, res) => {
  const {email, senha } = req.body;

  try{
    // procura o usuario no banco de dados
    const usuario = await Usuario.findOne({email});
    if(!usuario){
      return res.status(404).json({error: "Usuario não encontrado!"})
    }
    
    // comparar com senhas
    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if(!senhaValida){
      return res.status(401).json({error: "senha invalida"})
    }

    res.json({message: "Login bem sucedido"})

  }catch(error){
    console.log(error)
  }


})


app.use((req, res) => {
  res.status(404).send("Página não encontrada!");
});

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error("Erro: A variável de ambiente MONGODB_URI não está definida.");
  process.exit(1); // Encerra o processo, pois a conexão com o banco é crítica
}
const options = {
  serverSelectionTimeoutMS: 30000, // 30 segundos
  socketTimeoutMS: 30000, // 30 segundos
};
// Conexão com o banco de dados
mongoose
  .connect(uri, options)
  .then(() => {
    console.log("Conectado ao banco de dados");
  })
  .catch((error) => {
    console.error("Erro de conexão com o banco de dados:", error);
  });

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Servidor esta rodando em http://localhost:${PORT}`);
});
