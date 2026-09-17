import express from "express";
import "dotenv/config";

const app = express();
const port = 3000;

app.use(express.json());

const Ponêis = [
  { id: 1, nome: "Twilight Sparkle", tipo: "Unicórnio/Alicórnio" },
  { id: 2, nome: "Rarity", tipo: "Unicórnio" },
  { id: 3, nome: "Rainbondash", tipo: "Pegasus" },
  { id: 4, nome: "Fluttershy", tipo: "Pegasus" },
  { id: 5, nome: "Apple Jack", tipo: "Pônei da Terra" },
  { id: 6, nome: "Pinkie Pie", tipo: "Pônei da Terra" },

];

function autenticar(req, res, next) {
  const authHeader = req.headers.authorization;
  const tokenSecreto = process.env.TOKEN_SECRETO;

  if (authHeader !== `Bearer ${tokenSecreto}`) {
    return res.status(401).json({
      erro: "Acesso não autorizado :-( (Token ausente ou inválido)"
    });
  }

  next();
}

app.get("/", (req, res) => {
  res.json({
    mensagem: "Servidor Express funcionando! :D",
    disciplina: "Desenvolvimento de Websites",
    bimestre: "3º bimestre"
  });
});

app.get("Ponêis", autenticar, (req, res) => {
  res.json Ponêis); //mostra tds os poneis
});

app.get("Ponêis/:id", (req, res) => {
  const id = Number(req.params.id); // mostra ponei por id

  const Pônei = Ponêis.find((Pônei) => Pônei.id === id);

  if (!Pônei) { //se n tiver id n mostra ponei
    return res.status(404).json({
      message: "Desculpe! Não pude achar esse pônei :-("
    });
  }

  res.json(Pônei); //dá a resposta em json
});

app.post("Ponêis", autenticar, (req, res) => { //cria novo ponei
  const novoPônei = {
    id: Ponêis.length + 1,
    nome: req.body.nome,
    tipo: req.body.tipo
  };

 Ponêis.push(novoPônei); //n faço ideia mas tem haver com o acima, faz parte desse processo

  res.status(201).json({
    mensagem: "Novo Pônei adicionado! ^^",
    Pônei: novoPônei
  });
});

app.patch(" Ponêis/:id", autenticar, (req, res) => { //edita ponei
  const id = Number(req.params.id);
  const { nome, tipo } = req.body;

  const Pônei = Ponêis.find((Pônei) => Pônei.id === id);

  if (!Pônei) {
    return res.status(404).json({
      message: "Desculpe! Não pude achar esse pônei :-( "
    });
  }

  if (nome) {
    Pônei.nome = nome;
  }

  if (tipo) {
    Pônei.tipo = tipo;
  }

  res.json(Pônei);
});

app.delete(" Ponêis/:id", autenticar, (req, res) => { //deleta ponei por id
  const id = Number(req.params.id);

  const PôneiIndex = Ponêis.findIndex((Pônei) => Pônei.id === id);

  if (PôneiIndex === -1) {
    return res.status(404).json({
      message: "Desculpe! Não pude achar esse pônei :-("
    });
  }

 Ponêis.splice(PôneiIndex, 1);

  res.json({
    message: "Pônei removido com sucesso"
  });
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});

