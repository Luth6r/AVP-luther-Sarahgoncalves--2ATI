import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import multer from "multer";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "token.env") });

const app = express();
const port = Number(process.env.PORT) || 3000;
const jwtSecret = process.env.JWT_SECRET || "segredo-local-av2";
const uploadDir = path.join(__dirname, process.env.UPLOAD_DIR || "uploads");

fs.mkdirSync(uploadDir, { recursive: true });
app.use(express.json());

const usuarios = [];
const poneis = [
  { id: 1, nome: "Twilight Sparkle", tipo: "Unicornio/Alicornio" },
  { id: 2, nome: "Rarity", tipo: "Unicornio" },
  { id: 3, nome: "Rainbow Dash", tipo: "Pegasus" },
  { id: 4, nome: "Fluttershy", tipo: "Pegasus" },
  { id: 5, nome: "Applejack", tipo: "Ponei da Terra" },
  { id: 6, nome: "Pinkie Pie", tipo: "Ponei da Terra" }
];

function usuarioSemSenha(usuario) {
  return { id: usuario.id, nome: usuario.nome, email: usuario.email };
}

function autenticar(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ erro: "Token ausente" });
  }

  try {
    req.usuario = jwt.verify(token, jwtSecret);
    next();
  } catch {
    return res.status(401).json({ erro: "Token invalido ou expirado" });
  }
}

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, uploadDir),
  filename: (_req, file, callback) => {
    const extensao = path.extname(file.originalname).toLowerCase();
    callback(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${extensao}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (!file.mimetype.startsWith("image/")) {
      return callback(new Error("Apenas arquivos de imagem sao permitidos"));
    }
    callback(null, true);
  }
});

app.get("/", (_req, res) => {
  res.json({ mensagem: "API de Poneis funcionando", versao: "AV2" });
});

app.post("/usuarios", async (req, res) => {
  const { nome, email, senha } = req.body || {};
  if (!nome || !email || !senha) {
    return res.status(400).json({ erro: "nome, email e senha sao obrigatorios" });
  }
  if (usuarios.some((usuario) => usuario.email === email)) {
    return res.status(409).json({ erro: "Email ja cadastrado" });
  }

  const usuario = {
    id: usuarios.length + 1,
    nome,
    email,
    senha: await bcrypt.hash(senha, 10)
  };
  usuarios.push(usuario);
  res.status(201).json({ mensagem: "Usuario cadastrado", usuario: usuarioSemSenha(usuario) });
});

app.post("/login", async (req, res) => {
  const { email, senha } = req.body || {};
  const usuario = usuarios.find((item) => item.email === email);
  if (!usuario || !(await bcrypt.compare(senha || "", usuario.senha))) {
    return res.status(401).json({ erro: "Email ou senha invalidos" });
  }

  const token = jwt.sign({ id: usuario.id, email: usuario.email }, jwtSecret, { expiresIn: "2h" });
  res.json({ mensagem: "Login realizado", token, usuario: usuarioSemSenha(usuario) });
});

app.get("/poneis", (_req, res) => res.json(poneis));

app.get("/poneis/:id", (req, res) => {
  const ponei = poneis.find((item) => item.id === Number(req.params.id));
  if (!ponei) return res.status(404).json({ erro: "Ponei nao encontrado" });
  res.json(ponei);
});

app.post("/poneis", autenticar, (req, res) => {
  const { nome, tipo } = req.body;
  if (!nome || !tipo) return res.status(400).json({ erro: "nome e tipo sao obrigatorios" });
  const ponei = { id: poneis.length ? Math.max(...poneis.map((item) => item.id)) + 1 : 1, nome, tipo };
  poneis.push(ponei);
  res.status(201).json(ponei);
});

function editarPonei(req, res) {
  const ponei = poneis.find((item) => item.id === Number(req.params.id));
  if (!ponei) return res.status(404).json({ erro: "Ponei nao encontrado" });
  if (req.body.nome) ponei.nome = req.body.nome;
  if (req.body.tipo) ponei.tipo = req.body.tipo;
  res.json(ponei);
}

app.put("/poneis/:id", autenticar, editarPonei);
app.patch("/poneis/:id", autenticar, editarPonei);

app.delete("/poneis/:id", autenticar, (req, res) => {
  const indice = poneis.findIndex((item) => item.id === Number(req.params.id));
  if (indice === -1) return res.status(404).json({ erro: "Ponei nao encontrado" });
  poneis.splice(indice, 1);
  res.json({ mensagem: "Ponei removido com sucesso" });
});

app.post("/upload", autenticar, (req, res) => {
  upload.single("imagem")(req, res, (erro) => {
    if (erro) return res.status(400).json({ erro: erro.message });
    if (!req.file) return res.status(400).json({ erro: "Envie uma imagem no campo imagem" });
    res.status(201).json({ mensagem: "Upload realizado", arquivo: req.file.filename });
  });
});

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: { title: "API de Poneis", version: "1.0.0" },
    servers: [{ url: `http://localhost:${port}` }],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" }
      }
    },
    paths: {
      "/usuarios": {
        post: { summary: "Cadastra um usuario", responses: { 201: { description: "Usuario cadastrado" } } }
      },
      "/login": {
        post: { summary: "Realiza login e retorna um JWT", responses: { 200: { description: "Login realizado" } } }
      },
      "/poneis": {
        get: { summary: "Lista os poneis", responses: { 200: { description: "Lista retornada" } } },
        post: { summary: "Cadastra um ponei", security: [{ bearerAuth: [] }], responses: { 201: { description: "Ponei cadastrado" } } }
      },
      "/poneis/{id}": {
        get: { summary: "Consulta um ponei", responses: { 200: { description: "Ponei retornado" } } },
        put: { summary: "Edita um ponei", security: [{ bearerAuth: [] }], responses: { 200: { description: "Ponei editado" } } },
        delete: { summary: "Exclui um ponei", security: [{ bearerAuth: [] }], responses: { 200: { description: "Ponei excluido" } } }
      },
      "/upload": {
        post: { summary: "Envia uma imagem", security: [{ bearerAuth: [] }], responses: { 201: { description: "Upload realizado" } } }
      }
    }
  },
  apis: []
});
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.listen(port, () => console.log(`Servidor rodando em http://localhost:${port}`));

