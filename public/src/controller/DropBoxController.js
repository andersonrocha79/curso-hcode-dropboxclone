class DropBoxController
{    

    constructor()
    {        

        // # seleciona pelo id
        // . seleciona pela classe

        // armazena a pasta atual e subpastas
        // primeiro nó (hcode)
        this.currentFolder = ['hcode'];

        // criando um evento que será disparado
        // sempre que a seleção da lista for alterada
        this.onSelectionChange = new Event('selectionChange');

        // criando referência para os objetos de tela
        this.navEl         = document.querySelector("#browse-location");        
        this.btnSendFileEl = document.querySelector('#btn-send-file');
        this.inputFilesEl  = document.querySelector('#files');
        this.snackModalEl  = document.querySelector('#react-snackbar-root');
        this.progressBarEl = this.snackModalEl.querySelector(".mc-progress-bar-fg");
        this.nameFileEl    = this.snackModalEl.querySelector(".filename");
        this.timeLeftEl    = this.snackModalEl.querySelector(".timeleft");
        this.listFilesEl   = document.querySelector('#list-of-files-and-directories'); 
        this.btnNewFolder  = document.querySelector('#btn-new-folder');
        this.btnRename     = document.querySelector('#btn-rename');
        this.btnDelete     = document.querySelector('#btn-delete');


        // cria a conexão com o firebase
        this.connectFirebase();

        // configurando os eventos dos objetos de tela
        this.initEvents();

        // abre a pasta 'raiz'
        this.openFolder();

    }

    connectFirebase()
    {

        // Your web app's Firebase configuration
        var firebaseConfig = 
        {
            apiKey: "AIzaSyCKfKH7D9UfDkXqO_8f14q-7wyUux4LU70",
            authDomain: "drop-box-clone-fe811.firebaseapp.com",
            databaseURL: "https://drop-box-clone-fe811.firebaseio.com",
            projectId: "drop-box-clone-fe811",
            storageBucket: "drop-box-clone-fe811.appspot.com",
            messagingSenderId: "249069202353",
            appId: "1:249069202353:web:8525f2af1819d3ed652b90",
            measurementId: "G-CJDD75ZSNP"
        };

        // Initialize Firebase
        if (!firebase.apps.length) 
        {
            firebase.initializeApp(firebaseConfig);
            // firebase.analytics();
        }
        
    }

    getSelection()
    {
        // retorna uma coleção com todos os itens com a classe 'selected'
        return this.listFilesEl.querySelectorAll('.selected');
    }

    removeTask()
    {

        // cria o array de promessas
        let promises = [];

        // retorna a lista de arquivos selecionados
        // faz um 'foreach' na lista de arquivos selecionados
        // armazenando o item em 'li'
        this.getSelection().forEach(li =>
        {

            // pega o registro 'json' que está
            // armazenado como 'texto' na propridade 'dataset.file' da linha da tabela
            let file = JSON.parse(li.dataset.file);
            let key  = li.dataset.key;

            // cria o form data e passa os parâmetros do formulário
            let formData = new FormData();
            formData.append('path', file.path);
            formData.append('key' , key);

            // inclui a promisse na lista de promises
            promises.push(this.ajax('/file', 'DELETE', formData));

        });

        // o retorno desta função será o array de promessas, uma para cada arquivo
        return Promise.all(promises);

    }

    initEvents()
    {

        // evento ao clicar no botão 'nova pasta'
        this.btnNewFolder.addEventListener('click', e =>
        {

            // solicita o nome da pasta
            let name = prompt('Informe o nome da nova pasta:' );

            // inicia o objeto que irá armazenar o registro da nova pasta
            let novaPasta;

            // verifica se o nome foi informado
            if (name)
            {
                // cria um novo registro json, passando
                // os dados da nova pasta criada 
                // currentFolder é um array que tem o caminho das pastas selecionadas
                // o método join une este caminhos do array, separando por '/'

                // cria um objeto que representa a nova pasta
                novaPasta = {
                                name: name,
                                type: 'folder',
                                path: this.currentFolder.join('/')
                            };

                // inclui o registro no firebase            
                this.getFirebaseRef().push().set(novaPasta);

            }

            console.log('criou uma nova pasta: ', novaPasta);

        });

        // define o que deve ser feito ao clicar no botão 'excluir'
        this.btnDelete.addEventListener('click', e =>
        {

            // chama uma função que retorna uma promise
            this.removeTask().then(responses=>
            {

                // percorre a resposta de todos os métodos executados nas promises
                responses.forEach(response=>
                {

                    // verifica se a resposta retornou o key do arquivo
                    if (response.fields.key)
                    {

                        // remove o arquivo do firebase
                        this.getFirebaseRef().child(response.fields.key).remove();

                    }

                });

                console.log('resposta da promise de exclusão:', responses);

                // dispara um evento, informando que
                // o conteúdo da lista foi alterado
                this.listFilesEl.dispatchEvent(this.onSelectionChange);

            }).catch( err =>
            {
                console.error(err);
            });

        });

        // define o que deve ser feito ao clicar no botão para renomear o arquivo
        this.btnRename.addEventListener('click', e=>
        {

            // armazena a 'li', ou o item que está selecionado na lista
            // primeiro item da coleção retornada pela função 'getselection'
            let li = this.getSelection()[0];

            // pega o texto que foi armazenado no 'dataset' da linha
            // e transforma ele em um objeto json novamente
            let file = JSON.parse(li.dataset.file);

            // pergunta ao usuário o novo nome do arquivo
            let novoName = prompt("Novo nome para este arquivo:", file.name);

            // verifica se o nome foi informado
            if (novoName)
            {

                // troca o nome do arquivo no objeto 'file'
                file.name = novoName;

                // obtém a referência do firebase e pesquisa o registro
                // com o id do arquivo (item da lista) que foi selecionado
                this.getFirebaseRef().child(li.dataset.key).set(file);

                console.log("nome do arquivo alterado para ", novoName);

            }



        });

        // define o método a ser executado sempre que o evento 'selectionChange'
        // acontecer. este evento foi criado por nós para avisar
        // ao sistema sempre que a seleção da lista for alterada
        this.listFilesEl.addEventListener('selectionChange', e =>
        {

            let itensSelecionados = this.getSelection().length;

            console.log("itens selecionados na lista: ", itensSelecionados);

            switch (itensSelecionados)
            {

                case 0:
                    this.btnDelete.style.display = 'none';
                    this.btnRename.style.display = 'none';
                break;

                case 1:
                    this.btnDelete.style.display = 'block';
                    this.btnRename.style.display = 'block';
                break;

                default:
                    this.btnDelete.style.display = 'block';
                    this.btnRename.style.display = 'none';

            }

        });

        // clique no botão 'enviar arquivos'
        this.btnSendFileEl.addEventListener('click', event =>
        {

            this.inputFilesEl.click();

        });

        // alteração do campo de inputfile
        this.inputFilesEl.addEventListener('change', event =>
        {

            this.btnSendFileEl.disable = true;

            // console.log(event.target.files);
            // envia os arquivos para o servidor
            this.uploadTask(event.target.files).then(responses =>
            {

                console.log('respostas do método uploadTask: ', responses);

                responses.forEach(resp => 
                {

                    // grava os dados do arquivo no firebase      
                    // *** versão anterior, quando armazenava o arquivo no servidor http              
                    // this.getFirebaseRef().push().set(resp.files['input-file']);

                    console.log('retorno do firebase: ', resp);

                    // *** versão storage
                    // novo modo de buscar a URL do arqv no Firebase
                    resp.ref.getDownloadURL().then(downloadURL => 
                        {
 
                        // add uma nova entrada no DB
                        this.getFirebaseRef().push().set({
                            name: resp.name,
                            type: resp.contentType,
                            path: downloadURL,
                            size: resp.size
                        });
 
                    });

                });

                this.uploadComplete();
                
            }).catch(err =>
            {
                this.uploadComplete();
                console.error(err);
            });

            // exibe a janela modal pequena
            // informando que o arquivo selecionado está sendo enviado
            this.modalShow(true);     

        });

    }

    

    uploadComplete()
    {

       // mostra o modal com o percentual de envio do arquivo
        this.modalShow(false);        

        // zera a barra de progresso
        this.inputFilesEl.value = '';

        // habilita o botão novamente
        this.btnSendFileEl.disable = true;

    }

    modalShow(show = true)
    {

        this.snackModalEl.style.display = (show) ? 'block' : 'none';

    }

    // faz a chamada para retornar uma referencia
    // do firebase, no path solicitado
    getFirebaseRef(path)    
    {

        if (!path)
        {
            // se não passar um caminho, pega
            // o caminho especificado no array 'current folder',
            // separando os itens do array por '/'
            path = this.currentFolder.join('/');
        }
        
        // acessa o caminho e retorna o objeto firebase
        return firebase.database().ref(path);

    }

    ajax(url, 
         method      = 'GET', 
         formData    = new FormData(),
         onprogress  = function(){},
         onloadstart = function(){})
    {

        // retorna uma promessa de execução
        // que pode dar certo ou não
        return new Promise((resolve, reject) =>
        {

            // faz a chamada do ajax para fazer a solicitação para cada arquivo
            let ajax = new XMLHttpRequest();

            // define o método a ser executado
            ajax.open(method, url);

            // define o evento a ser executado
            ajax.onload = event =>
            {

                try
                {
                    resolve(JSON.parse(ajax.responseText));
                }
                catch (e)
                {
                    reject(e);
                }

            }

            // define o evento a ser executado no erro
            ajax.onerror = event =>
            {
                reject(event.e);
            }

            // executa o evento 'onprogress' passado como parâmetro
            ajax.upload.onprogress = onprogress;

            // armazena a hora em que o processo iniciou
            // executa o evento onloadstart passado como parâmetro para esta função
            onloadstart();

            // envia o form com o input file para o servidor
            ajax.send(formData);                 

        });

    }

    // versão da função para armazenar
    // os arquivos no servidor http
    /*
    uploadTask(files)
    {

        // inicializa o array de promessas
        // uma promessa para cada arquivo
        let promises = []; 

        // percorre a lista de arquivos
        // e inclui no array, uma promessa para cada arquivo a ser enviado
        [...files].forEach(file =>
        {

            // executa a ação para envio do arquivo
            // simula um form para envio da mensagem post
            let formData = new FormData();
            formData.append('input-file', file);

            // cria uma promise para upload do arquivo
            let promise = this.ajax('/upload',                                // url
                                    'POST',                                   // método a ser executado
                                    formData,                                 // dados do formulário        
                                    ()=>                                      // método a ser executado que demonstra o progresso    
                                    {
                                        this.uploadProgress(event, file);
                                    },
                                    ()=>                                      // método a ser executado para demonstrar a hora de início     
                                    {
                                        this.startUploadTime = Date.now();
                                    });
            
            // inclui a promessa na lista de promessas
            promises.push(promise);

        });

        // executa todas as promessas
        // de uma única vez com o método .all
        return Promise.all(promises)

    }
    */

    // versão da função para
    // armazenar os arquivos no 'storage' do firebase
    uploadTask(files)
    {

       // inicializa o array de promessas
       // uma promessa para cada arquivo
       let promises = []; 

       // percorre a lista de arquivos
       // e inclui no array, uma promessa para cada arquivo a ser enviado
       [...files].forEach(file =>
       {

           // inclui a promessa na lista de promessas
           promises.push(new Promise((resolve, reject) =>
           {

                // cria a referência para armazenamento do arquivo
                let fileRef = firebase.storage().ref(this.currentFolder.join("/")).child(file.name);     

                // faz o upload do arquivo
                // retorna a 'task' para monitorar o envio do arquivo
                let task = fileRef.put(file);

                // fica escutando o firebase para analisar como está o processamento
                task.on('state_changed', 
                    snapshot =>
                    {
                        // método que demonstra o processamento
                        console.log('progresso do envio', snapshot);
                        // atualiza a barra com o percentual de envio do arquivo
                        this.uploadProgress(
                            {
                                loaded : snapshot.bytesTransferred,
                                total: snapshot.totalBytes
                            }, 
                            file);
                    },
                    error =>
                    {
                        // método a ser executado quando ocorrer erro no envio do arquivo
                        console.error(error);
                        // executa o método 'reject' da promessa, caso ocorra erro
                        reject(error);
                    },
                    () =>
                    {
                        // busca os metadados do arquivo enviado
                        fileRef.getMetadata().then(metadata=>
                        {

                            // executa o método resolve da promessa,
                            // indicando que houve sucesso no envio do arquivo
                            resolve(metadata);

                        }).catch(err =>
                        {
                            // executa o reject, indicando erro no envio
                            reject(err);
                        });

                    });

           }));

       });

       // executa todas as promessas
       // de uma única vez com o método .all
       return Promise.all(promises)

   }    

    // atualiza o percentual de envio do arquivo
    uploadProgress(event, file)
    {

        // calcula o tempo gasto até o momento
        let timeSpent = Date.now() - this.startUploadTime; 

        // total de bytes enviados
        let loaded = event.loaded;

        // total de bytes do arquivo
        let total  = event.total;

        // calcula o percentual já enviado
        let porcent = parseInt((loaded / total) * 100);

        // calcula o percentual restante para acabar
        let timeLeft = ((100 - porcent) * timeSpent) / porcent;

        // atualiza a barra de progresso
        this.progressBarEl.style.width = `${porcent}%`;

        // atualiza o nome do arquivo
        this.nameFileEl.innerHTML = file.name;

        // calcula o tempo restante
        this.timeLeftEl.innerHTML = this.formatTimeToHuman(timeLeft);

    }

    formatTimeToHuman(duration)
    {

        // convertendo milessegundos em segundos, minutos e hora

        let seconds  = parseInt((duration / 1000) % 60);
        let minutes  = parseInt((duration / (1000 * 60)) % 60);
        let hours    = parseInt((duration / (1000 * 60 * 60)) % 24);

        if (hours > 0)
        {
            return `${hours} horas, ${minutes} minutos e ${seconds} segundos`;
        }
        else if (minutes > 0)
        {
            return `${minutes} minutos e ${seconds} segundos`;
        }
        else if (seconds > 0)
        {
            return `${seconds} segundos`;
        }        
        else
        {
            return 'finalizado';
        }
    }

    getFileIconView(file)
    {

        console.log(file);

        switch (file.type)
        {
            case 'folder':
                return `
                <svg width="160" height="160" viewBox="0 0 160 160" class="mc-icon-template-content tile__preview tile__preview--icon">
                    <title>content-folder-large</title>
                    <g fill="none" fill-rule="evenodd">
                        <path d="M77.955 53h50.04A3.002 3.002 0 0 1 131 56.007v58.988a4.008 4.008 0 0 1-4.003 4.005H39.003A4.002 4.002 0 0 1 35 114.995V45.99c0-2.206 1.79-3.99 3.997-3.99h26.002c1.666 0 3.667 1.166 4.49 2.605l3.341 5.848s1.281 2.544 5.12 2.544l.005.003z" fill="#71B9F4"></path>
                        <path d="M77.955 52h50.04A3.002 3.002 0 0 1 131 55.007v58.988a4.008 4.008 0 0 1-4.003 4.005H39.003A4.002 4.002 0 0 1 35 113.995V44.99c0-2.206 1.79-3.99 3.997-3.99h26.002c1.666 0 3.667 1.166 4.49 2.605l3.341 5.848s1.281 2.544 5.12 2.544l.005.003z" fill="#92CEFF"></path>
                    </g>
                </svg>
                `;
                break;

             default:
                return `
                <svg width="160" height="160" viewBox="0 0 160 160" class="mc-icon-template-content tile__preview tile__preview--icon">
                    <title>1357054_617b.jpg</title>
                    <defs>
                        <rect id="mc-content-unknown-large-b" x="43" y="30" width="74" height="100" rx="4"></rect>
                        <filter x="-.7%" y="-.5%" width="101.4%" height="102%" filterUnits="objectBoundingBox" id="mc-content-unknown-large-a">
                            <feOffset dy="1" in="SourceAlpha" result="shadowOffsetOuter1"></feOffset>
                            <feColorMatrix values="0 0 0 0 0.858823529 0 0 0 0 0.870588235 0 0 0 0 0.88627451 0 0 0 1 0" in="shadowOffsetOuter1"></feColorMatrix>
                        </filter>
                    </defs>
                    <g fill="none" fill-rule="evenodd">
                        <g>
                            <use fill="#000" filter="url(#mc-content-unknown-large-a)" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#mc-content-unknown-large-b"></use>
                            <use fill="#F7F9FA" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#mc-content-unknown-large-b"></use>
                        </g>
                    </g>
                </svg>
                `;
                break;

            case 'image/jpeg':
            case 'image/jpg':
            case 'image/png':
            case 'image/gif':
                return `
                <svg version="1.1" id="Camada_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="160px" height="160px" viewBox="0 0 160 160" enable-background="new 0 0 160 160" xml:space="preserve">
                    <filter height="102%" width="101.4%" id="mc-content-unknown-large-a" filterUnits="objectBoundingBox" y="-.5%" x="-.7%">
                        <feOffset result="shadowOffsetOuter1" in="SourceAlpha" dy="1"></feOffset>
                        <feColorMatrix values="0 0 0 0 0.858823529 0 0 0 0 0.870588235 0 0 0 0 0.88627451 0 0 0 1 0" in="shadowOffsetOuter1">
                        </feColorMatrix>
                    </filter>
                    <title>Imagem</title>
                    <g>
                        <g>
                            <g filter="url(#mc-content-unknown-large-a)">
                                <path id="mc-content-unknown-large-b_2_" d="M47,30h66c2.209,0,4,1.791,4,4v92c0,2.209-1.791,4-4,4H47c-2.209,0-4-1.791-4-4V34
                                        C43,31.791,44.791,30,47,30z"></path>
                            </g>
                            <g>
                                <path id="mc-content-unknown-large-b_1_" fill="#F7F9FA" d="M47,30h66c2.209,0,4,1.791,4,4v92c0,2.209-1.791,4-4,4H47
                                        c-2.209,0-4-1.791-4-4V34C43,31.791,44.791,30,47,30z"></path>
                            </g>
                        </g>
                    </g>
                    <g>
                        <path fill-rule="evenodd" clip-rule="evenodd" fill="#848484" d="M81.148,62.638c8.086,0,16.173-0.001,24.259,0.001
                                c1.792,0,2.3,0.503,2.301,2.28c0.001,11.414,0.001,22.829,0,34.243c0,1.775-0.53,2.32-2.289,2.32
                                c-16.209,0.003-32.417,0.003-48.626,0c-1.775,0-2.317-0.542-2.318-2.306c-0.002-11.414-0.003-22.829,0-34.243
                                c0-1.769,0.532-2.294,2.306-2.294C64.903,62.637,73.026,62.638,81.148,62.638z M81.115,97.911c7.337,0,14.673-0.016,22.009,0.021
                                c0.856,0.005,1.045-0.238,1.042-1.062c-0.028-9.877-0.03-19.754,0.002-29.63c0.003-0.9-0.257-1.114-1.134-1.112
                                c-14.637,0.027-29.273,0.025-43.91,0.003c-0.801-0.001-1.09,0.141-1.086,1.033c0.036,9.913,0.036,19.826,0,29.738
                                c-0.003,0.878,0.268,1.03,1.069,1.027C66.443,97.898,73.779,97.911,81.115,97.911z"></path>
                        <path fill-rule="evenodd" clip-rule="evenodd" fill="#848484" d="M77.737,85.036c3.505-2.455,7.213-4.083,11.161-5.165
                                c4.144-1.135,8.364-1.504,12.651-1.116c0.64,0.058,0.835,0.257,0.831,0.902c-0.024,5.191-0.024,10.381,0.001,15.572
                                c0.003,0.631-0.206,0.76-0.789,0.756c-3.688-0.024-7.375-0.009-11.062-0.018c-0.33-0.001-0.67,0.106-0.918-0.33
                                c-2.487-4.379-6.362-7.275-10.562-9.819C78.656,85.579,78.257,85.345,77.737,85.036z"></path>
                        <path fill-rule="evenodd" clip-rule="evenodd" fill="#848484" d="M87.313,95.973c-0.538,0-0.815,0-1.094,0
                                c-8.477,0-16.953-0.012-25.43,0.021c-0.794,0.003-1.01-0.176-0.998-0.988c0.051-3.396,0.026-6.795,0.017-10.193
                                c-0.001-0.497-0.042-0.847,0.693-0.839c6.389,0.065,12.483,1.296,18.093,4.476C81.915,90.33,84.829,92.695,87.313,95.973z"></path>
                        <path fill-rule="evenodd" clip-rule="evenodd" fill="#848484" d="M74.188,76.557c0.01,2.266-1.932,4.223-4.221,4.255
                                c-2.309,0.033-4.344-1.984-4.313-4.276c0.03-2.263,2.016-4.213,4.281-4.206C72.207,72.338,74.179,74.298,74.188,76.557z"></path>
                    </g>
                </svg>
                `;
                break;

            case 'application/pdf':
                return `
                <svg version="1.1" id="Camada_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="160px" height="160px" viewBox="0 0 160 160" enable-background="new 0 0 160 160" xml:space="preserve">
                    <filter height="102%" width="101.4%" id="mc-content-unknown-large-a" filterUnits="objectBoundingBox" y="-.5%" x="-.7%">
                        <feOffset result="shadowOffsetOuter1" in="SourceAlpha" dy="1"></feOffset>
                        <feColorMatrix values="0 0 0 0 0.858823529 0 0 0 0 0.870588235 0 0 0 0 0.88627451 0 0 0 1 0" in="shadowOffsetOuter1">
                        </feColorMatrix>
                    </filter>
                    <title>PDF</title>
                    <g>
                        <g>
                            <g filter="url(#mc-content-unknown-large-a)">
                                <path id="mc-content-unknown-large-b_2_" d="M47,30h66c2.209,0,4,1.791,4,4v92c0,2.209-1.791,4-4,4H47c-2.209,0-4-1.791-4-4V34
                                        C43,31.791,44.791,30,47,30z"></path>
                            </g>
                            <g>
                                <path id="mc-content-unknown-large-b_1_" fill="#F7F9FA" d="M47,30h66c2.209,0,4,1.791,4,4v92c0,2.209-1.791,4-4,4H47
                                        c-2.209,0-4-1.791-4-4V34C43,31.791,44.791,30,47,30z"></path>
                            </g>
                        </g>
                    </g>
                    <path fill-rule="evenodd" clip-rule="evenodd" fill="#F15124" d="M102.482,91.479c-0.733-3.055-3.12-4.025-5.954-4.437
                            c-2.08-0.302-4.735,1.019-6.154-0.883c-2.167-2.905-4.015-6.144-5.428-9.482c-1.017-2.402,1.516-4.188,2.394-6.263
                            c1.943-4.595,0.738-7.984-3.519-9.021c-2.597-0.632-5.045-0.13-6.849,1.918c-2.266,2.574-1.215,5.258,0.095,7.878
                            c3.563,7.127-1.046,15.324-8.885,15.826c-3.794,0.243-6.93,1.297-7.183,5.84c0.494,3.255,1.988,5.797,5.14,6.825
                            c3.062,1,4.941-0.976,6.664-3.186c1.391-1.782,1.572-4.905,4.104-5.291c3.25-0.497,6.677-0.464,9.942-0.025
                            c2.361,0.318,2.556,3.209,3.774,4.9c2.97,4.122,6.014,5.029,9.126,2.415C101.895,96.694,103.179,94.38,102.482,91.479z
                            M67.667,94.885c-1.16-0.312-1.621-0.97-1.607-1.861c0.018-1.199,1.032-1.121,1.805-1.132c0.557-0.008,1.486-0.198,1.4,0.827
                            C69.173,93.804,68.363,94.401,67.667,94.885z M82.146,65.949c1.331,0.02,1.774,0.715,1.234,1.944
                            c-0.319,0.725-0.457,1.663-1.577,1.651c-1.03-0.498-1.314-1.528-1.409-2.456C80.276,65.923,81.341,65.938,82.146,65.949z
                            M81.955,86.183c-0.912,0.01-2.209,0.098-1.733-1.421c0.264-0.841,0.955-2.04,1.622-2.162c1.411-0.259,1.409,1.421,2.049,2.186
                            C84.057,86.456,82.837,86.174,81.955,86.183z M96.229,94.8c-1.14-0.082-1.692-1.111-1.785-2.033
                            c-0.131-1.296,1.072-0.867,1.753-0.876c0.796-0.011,1.668,0.118,1.588,1.293C97.394,93.857,97.226,94.871,96.229,94.8z"></path>
                </svg>
                `;
                break;

            case 'audio/mp3':
            case 'audio/ogg':
                return `
                <svg width="160" height="160" viewBox="0 0 160 160" class="mc-icon-template-content tile__preview tile__preview--icon">
                    <title>content-audio-large</title>
                    <defs>
                        <rect id="mc-content-audio-large-b" x="30" y="43" width="100" height="74" rx="4"></rect>
                        <filter x="-.5%" y="-.7%" width="101%" height="102.7%" filterUnits="objectBoundingBox" id="mc-content-audio-large-a">
                            <feOffset dy="1" in="SourceAlpha" result="shadowOffsetOuter1"></feOffset>
                            <feColorMatrix values="0 0 0 0 0.858823529 0 0 0 0 0.870588235 0 0 0 0 0.88627451 0 0 0 1 0" in="shadowOffsetOuter1"></feColorMatrix>
                        </filter>
                    </defs>
                    <g fill="none" fill-rule="evenodd">
                        <g>
                            <use fill="#000" filter="url(#mc-content-audio-large-a)" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#mc-content-audio-large-b"></use>
                            <use fill="#F7F9FA" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#mc-content-audio-large-b"></use>
                        </g>
                        <path d="M67 60c0-1.657 1.347-3 3-3 1.657 0 3 1.352 3 3v40c0 1.657-1.347 3-3 3-1.657 0-3-1.352-3-3V60zM57 78c0-1.657 1.347-3 3-3 1.657 0 3 1.349 3 3v4c0 1.657-1.347 3-3 3-1.657 0-3-1.349-3-3v-4zm40 0c0-1.657 1.347-3 3-3 1.657 0 3 1.349 3 3v4c0 1.657-1.347 3-3 3-1.657 0-3-1.349-3-3v-4zm-20-5.006A3 3 0 0 1 80 70c1.657 0 3 1.343 3 2.994v14.012A3 3 0 0 1 80 90c-1.657 0-3-1.343-3-2.994V72.994zM87 68c0-1.657 1.347-3 3-3 1.657 0 3 1.347 3 3v24c0 1.657-1.347 3-3 3-1.657 0-3-1.347-3-3V68z" fill="#637282"></path>
                    </g>
                </svg>
                `;
                break;

            case 'video/mp4':
            case 'video/quicktime':
                return `<svg width="160" height="160" viewBox="0 0 160 160" class="mc-icon-template-content tile__preview tile__preview--icon">
                    <title>content-video-large</title>
                    <defs>
                        <rect id="mc-content-video-large-b" x="30" y="43" width="100" height="74" rx="4"></rect>
                        <filter x="-.5%" y="-.7%" width="101%" height="102.7%" filterUnits="objectBoundingBox" id="mc-content-video-large-a">
                            <feOffset dy="1" in="SourceAlpha" result="shadowOffsetOuter1"></feOffset>
                            <feColorMatrix values="0 0 0 0 0.858823529 0 0 0 0 0.870588235 0 0 0 0 0.88627451 0 0 0 1 0" in="shadowOffsetOuter1"></feColorMatrix>
                        </filter>
                    </defs>
                    <g fill="none" fill-rule="evenodd">
                        <g>
                            <use fill="#000" filter="url(#mc-content-video-large-a)" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#mc-content-video-large-b"></use>
                            <use fill="#F7F9FA" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#mc-content-video-large-b"></use>
                        </g>
                        <path d="M69 67.991c0-1.1.808-1.587 1.794-1.094l24.412 12.206c.99.495.986 1.3 0 1.794L70.794 93.103c-.99.495-1.794-.003-1.794-1.094V67.99z" fill="#637282"></path>
                    </g>
                </svg>
                `
                break;
        }
    }

    getFileView(file, key)
    {

        // cria um novo elemento da tabela
        let li = document.createElement('li');

        // armazena no elemento o 'key' que é a chave do registro no firebase
        li.dataset.key = key;

        // armazena o registro 'file' no item da lista
        // a função stringfy pega um objeto json e serializa em texto
        li.dataset.file = JSON.stringify(file);

        // define o conteúdo 'html' da linha da tabela
        li.innerHTML = 
        `
        <li>
            ${this.getFileIconView(file)}
            <div class="name text-center">${file.name}</div>
        </li>            
        `

        // adiciona o eventos para a linha da tabela (li)
        this.initEventsLi(li);

        // retorna a linha da tabela toda configurada
        return li;

    }

    // abre a pasta e demonstra os arquivos e subpastas dentro desta pasta
    openFolder()
    {

        // verifica se estava em algum pasta anterior
        if (this.lastFolder)
        {
            // avisa ao firebase para parar de ficar
            // notificando alterações na pasta anterior,
            // porque vamos passar a 'trabalhar' e 'ouvir' uma nova pasta
            this.getFirebaseRef(this.lastFolder).off('value');
        }

        // atualiza o título da pasta,
        // que demonstra o caminho de pastas percorrido até o momento
        this.renderNav();

        // faz a leitura dos registros do firebase
        // dentro da pasta 'atual'
        this.readFiles();

    }

    renderNav()
    {

        // cria uma nova 'tag' 'nav'
        let nav = document.createElement('nav');

        // array que demonstra o caminho completo da pasta
        let path = [];

        // percorre os itens do array que armazena
        // as pastas clicadas pelo usuário
        for (let i = 0; i < this.currentFolder.length; i++)
        {

            // armazena o nome da pasta
            let folderName = this.currentFolder[i];

            // cria o span que representa um elemento na lista
            let span = document.createElement('span');

            // inclui a pasta atual no array que representa o caminho completo
            path.push(folderName);

            // se for o último item do array, o layout é diferente
            if ((i + 1) === this.currentFolder.length)
            {

                // é o último item da lista
                span.innerHTML = folderName;

            }
            else
            {

                // define a classe da span
                span.className = "breadcrumb-segment__wrapper";

                // define o conteúdo do span
                span.innerHTML = `<span class="ue-effect-container uee-BreadCrumbSegment-link-0">
                                     <a href="#" data-path="${path.join('/')}"  
                                     class="breadcrumb-segment">${folderName}</a>
                                  </span>
                                  <svg width="24" height="24" viewBox="0 0 24 24" class="mc-icon-template-stateless" style="top: 4px; position: relative;">
                                     <title>arrow-right</title>
                                     <path d="M10.414 7.05l4.95 4.95-4.95 4.95L9 15.534 12.536 12 9 8.464z" fill="#637282" fill-rule="evenodd"></path>
                                  </svg>
                                 `;

            }       
            
            // não é o último item da lista
            nav.appendChild(span);            

        }

        this.navEl.innerHTML = nav.innerHTML;

        // percorre todos os 'links', objeto 'a'
        // que estejam no html do elemento navEl
        this.navEl.querySelectorAll('a').forEach(a=>
        {

            // define o evento de clique em cada
            // um dos links existentes nas subpastas da navegação
            a.addEventListener('click', e=>
            {

                // aborta o comportamento padrão do clique no elemento
                e.preventDefault();

                // altera a currentfolder, de acordo com
                // o caminho da folder definido em cada item do navEl
                // transforma a string que está no dataset do elemento
                // em array novamente
                this.currentFolder = a.dataset.path.split('/');

                // abre a pasta atual novamente
                this.openFolder();

            });

        });

        /*
        html modelo do nav, copiado da página atual
        <span class="breadcrumb-segment__wrapper">
            <span class="ue-effect-container uee-BreadCrumbSegment-link-0">
                <a href="https://www.dropbox.com/work" class="breadcrumb-segment">HCODE</a>
            </span>
            <svg width="24" height="24" viewBox="0 0 24 24" class="mc-icon-template-stateless" style="top: 4px; position: relative;">
                <title>arrow-right</title>
                <path d="M10.414 7.05l4.95 4.95-4.95 4.95L9 15.534 12.536 12 9 8.464z" fill="#637282" fill-rule="evenodd"></path>
            </svg>
        </span>
        */

    }

    initEventsLi(li)
    {

        // cria o evento para o clique duplo na linha da tabela
        li.addEventListener('dblclick', event =>
        {

            console.log('executou o click duplo');

            // pega o 'registro' json que está em 'dataset.file' 
            // e converte de texto para objeto javascript e armazena na variável 'file'
            let file = JSON.parse(li.dataset.file);

            // verifica o tipo do item clicado, para saber se é uma pasta
            switch (file.type)
            {

                case 'folder':
                    // clicou em uma pasta
                    // inclui o nome da pasta atual ao array
                    // que armazena o caminho de pastas e subpastas clicados
                    console.log('abriu o conteúdo da pasta: ', file);
                    // inclui a pasta clicada no array que representa a pasta atual
                    this.currentFolder.push(file.name);
                    // executa a função para demonstrar o conteúdo da pasta atual
                    this.openFolder();
                    break;

                default:
                    // se não for uma pasta, tenta abrir o arquivo
                    // window.open('/file?path=' + file.path);
                    window.open( file.path);
            }


        });

        // cria o evento de clique na linha da tabela
        li.addEventListener('click', e=>
        {

            console.log("elemento clicado >", li);

            // verifica se ao clicar, a tecla shift estava pressionado
            if (e.shiftKey)
            {

                console.log("shift pressionado");

                // obter o primeiro li que foi clicado
                let firstLi = this.listFilesEl.querySelector('.selected');

                // se já tem o primeiro clicado, vamos ver qual o segundo (ultimo)
                if (firstLi)
                {

                    // cria as variáveis para armazenar o índice do primeiro
                    // e do último elemento clicado
                    let indexStart;
                    let indexEnd;

                    // obtem uma referencia para a lista de itens da lista
                    let lis = li.parentElement.childNodes;

                    // o último clicado é o 'li' atual, que disparou o evento

                    // acessa o elemento pai da 'li', que é a própria tabela ('ul')
                    // acessa todos os 'filhos' do elemento pai, que seriam
                    // todas os 'li' da tabela 'ul'
                    lis.forEach((el, index) =>
                    {

                        // verifica se o elemento é o 'primeiro clicado'
                        // se for, armazena o índice deste elemnto
                        if (firstLi === el) indexStart = index;

                        // verifica se o elemtno é o 'último clicado'
                        // se for, armazena o índice
                        if (li === el) indexEnd = index;

                    });

                    console.log('primeiro index', indexStart);
                    console.log('ultimo item', indexEnd);

                    // cria um array e deixa ordernado
                    // porque pode clicar em um item da final da lista, depois clicar no primeiro
                    let index = [indexStart, indexEnd].sort();

                    // percorre a lista, marcando os elementos do intervalo como 'selecionado'
                    lis.forEach((el, i) =>
                    {

                        if (i >= index[0] && i <= index[1] )
                        {
                            el.classList.add('selected');
                        }

                    });

                    // dispara um evento, informando que
                    // o conteúdo da lista foi alterado
                    this.listFilesEl.dispatchEvent(this.onSelectionChange);

                    return true;
                    
                }

            }            

            // verifica se ao clicar, a tecla control estava pressionado
            if (!e.ctrlKey)
            {

                console.log("control não está pressionado");

                // seleciona todos os elementos da lista (li), que tem a classe 'selected'
                this.listFilesEl.querySelectorAll('li.selected').forEach(el => 
                {
                    // remove a classe do elemento, que identifica que está selecionado
                    el.classList.remove('selected');
                });

            }        

            // muda a classe selected (removendo ou incluindo)
            li.classList.toggle('selected');

            // dispara um evento, informando que
            // o conteúdo da lista foi alterado
            this.listFilesEl.dispatchEvent(this.onSelectionChange);

        });

    }

    readFiles()
    {

        // sempre que abrir uma pasta e ler os arquivos
        // armazena em 'lastFolder' o caminho 'string'
        // da ultima pasta selecionada
        this.lastFolder = this.currentFolder.join('/');

        // cria um evento que busca os registros
        // do nó 'files' do firebase, e fica 'escutando'
        // para ser executado sempre que os dados foram alterados no servidor
        this.getFirebaseRef().on('value', snapshot =>
        {

            console.log("Recebeu notificação do firebase: ", snapshot);

            this.listFilesEl.innerHTML = "";

            snapshot.forEach(snapshotItem =>
            {

                // recupera a key (chave) do registro no firebase
                let key  = snapshotItem.key;

                // armazena o conteúdo do registro (json)
                let data = snapshotItem.val(); 

                // verifica se tem a propriedade 'type'
                // se não tiver, indica que é um registro de 'subpastas', e não o conteúdo da pasta
                if (data.type)
                {
                    // inclui uma nova linha da tabela com os dados do registro
                    this.listFilesEl.appendChild(this.getFileView(data, key));
                }
                
            });

        });
    }

}