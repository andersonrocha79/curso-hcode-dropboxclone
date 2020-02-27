var express = require('express');
var router = express.Router();
var formidable = require('formidable');
var fs = require('fs');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

// rota 'get' para abrir os arquivos
router.get('/file', (req, res)  =>
{

   // armazena o caminho do arquivo
   let path = '.' + req.query.path;

   // verifica se o arquivo existe
   if (fs.existsSync(path))
   {

      // o arquivo existe
      // le o conteúdo do arquivo
      fs.readFile(path, (err, data) =>
      {
         // verifica se ocorreu algum erro
         // na leitura do arquivo
         if (err)
         {
            // retorna o erro
            console.error(err);
            res.status(400).json({error: err});
         }
         else
         {
            // retorna o conteúdo do arquivo
            res.status(200).end(data);
         }
      });

   }
   else
   {
      res.status(404).json({error: "file not found."});
   }

});

// rota do método delete para excluir o arquivo
router.delete('/file', (req, res)=>
{


   let form = new formidable.IncomingForm(
      {
         uploadDir: './upload',  // define o caminho de destino
         keepExtensions : true   // mantém a extensão do arquivo ao fazer o upload
      });
   
      // interpreta os dados enviados pelo formulário
      form.parse(req, (err, fields, files) =>
      {

         // define o path do arquivo
         let path = "./" + fields.path;

         // verifica se o arquivo existe
         if (fs.existsSync(path))
         {
            // exclui o arquivo
            fs.unlink(path, err=>
            {              
               // se ocorrer erro na exclusão, retorna o erro 400 (arquivo não existe)
               if (err)
               {
                  res.status(400).json({err});
               }
               else
               {
                  res.json({fields});
               }

            });
         } 
         else
         {
            res.status(404).json({error: "file not found."});
         }              

      });

});

// rota do método post para armazenar o arquivo
router.post('/upload', (req, res) =>
{

   let form = new formidable.IncomingForm(
   {
      uploadDir: './upload',  // define o caminho de destino
      keepExtensions : true   // mantém a extensão do arquivo ao fazer o upload
   });

   // interpreta os dados enviados pelo formulário
   form.parse(req, (err, fields, files) =>
   {
      res.json({
        files: files
      });
   });

});

module.exports = router;
