/* ============================================
   STUDYVAULT - JAVASCRIPT
   Trabalho Final - Desenvolvimento Web
   ============================================ */

// --------------------------------------------
// VARIÁVEIS GLOBAIS E ESTADO
// --------------------------------------------
let materias = [];
let atividades = [];
let materiaAtual = null; // ID da matéria aberta no modal

// Chaves do localStorage
const KEY_MATERIAS = 'studyvault_materias';
const KEY_ATIVIDADES = 'studyvault_atividades';

// --------------------------------------------
// INICIALIZAÇÃO
// --------------------------------------------
document.addEventListener('DOMContentLoaded', function() {
    carregarDados();
    renderizarMaterias();
    configurarEventos();
});

// --------------------------------------------
// LOCALSTORAGE - CARREGAR E SALVAR
// --------------------------------------------
function carregarDados() {
    const dadosMaterias = localStorage.getItem(KEY_MATERIAS);
    const dadosAtividades = localStorage.getItem(KEY_ATIVIDADES);

    if (dadosMaterias) {
        materias = JSON.parse(dadosMaterias);
    }
    if (dadosAtividades) {
        atividades = JSON.parse(dadosAtividades);
    }
}

function salvarDados() {
    localStorage.setItem(KEY_MATERIAS, JSON.stringify(materias));
    localStorage.setItem(KEY_ATIVIDADES, JSON.stringify(atividades));
}

// --------------------------------------------
// GERADOR DE ID ÚNICO
// --------------------------------------------
function gerarId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// --------------------------------------------
// FORMATAÇÃO DE DATA
// --------------------------------------------
function formatarData(dataString) {
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function obterDataAtual() {
    return new Date().toISOString();
}

// --------------------------------------------
// RENDERIZAR MATÉRIAS (GRID DE CARDS)
// --------------------------------------------
function renderizarMaterias() {
    const container = document.getElementById('listaMaterias');
    const msgVazio = document.getElementById('semMaterias');

    container.innerHTML = '';

    if (materias.length === 0) {
        msgVazio.style.display = 'block';
        return;
    }

    msgVazio.style.display = 'none';

    materias.forEach(materia => {
        const card = document.createElement('div');
        card.className = 'card-materia';
        card.onclick = () => abrirPasta(materia.id);

        // Conta quantas atividades existem nesta matéria
        const qtdAtividades = atividades.filter(a => a.materiaId === materia.id).length;

        card.innerHTML = `
            <h3>${escapeHtml(materia.nome)}</h3>
            <p>👨‍🏫 ${escapeHtml(materia.professor)}</p>
            <p>⏱️ ${materia.horas} horas</p>
            <span class="badge">${qtdAtividades} atividade(s)</span>
        `;

        container.appendChild(card);
    });
}

// --------------------------------------------
// MODAIS - ABRIR E FECHAR
// --------------------------------------------
function abrirModal(idModal) {
    const modal = document.getElementById(idModal);
    modal.classList.add('ativo');
    document.body.style.overflow = 'hidden'; // Impede scroll do body
}

function fecharModal(idModal) {
    const modal = document.getElementById(idModal);
    modal.classList.remove('ativo');
    document.body.style.overflow = '';

    // Limpa formulários ao fechar
    const form = modal.querySelector('form');
    if (form) {
        form.reset();
    }
}

// Fecha modal ao clicar fora do conteúdo
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('ativo');
        document.body.style.overflow = '';
    }
};

// --------------------------------------------
// ADICIONAR MATÉRIA
// --------------------------------------------
function adicionarMateria(event) {
    event.preventDefault();

    const nome = document.getElementById('nomeMateria').value.trim();
    const horas = document.getElementById('horasMateria').value.trim();
    const professor = document.getElementById('professorMateria').value.trim();

    // Validação simples
    if (!nome || !horas || !professor) {
        mostrarToast('Preencha todos os campos!', 'erro');
        return;
    }

    const novaMateria = {
        id: gerarId(),
        nome: nome,
        horas: parseInt(horas),
        professor: professor,
        dataCriacao: obterDataAtual()
    };

    materias.push(novaMateria);
    salvarDados();
    renderizarMaterias();

    fecharModal('modalMateria');
    mostrarToast('Matéria adicionada com sucesso!', 'sucesso');
}

// --------------------------------------------
// ABRIR PASTA DA MATÉRIA
// --------------------------------------------
function abrirPasta(id) {
    materiaAtual = id;
    const materia = materias.find(m => m.id === id);

    if (!materia) return;

    // Preenche informações no modal
    document.getElementById('tituloPasta').textContent = materia.nome;
    document.getElementById('infoHoras').textContent = materia.horas;
    document.getElementById('infoProfessor').textContent = materia.professor;

    renderizarAtividades(id);
    abrirModal('modalPasta');
}

// --------------------------------------------
// EXCLUIR MATÉRIA
// --------------------------------------------
function excluirMateriaAtual() {
    if (!materiaAtual) return;

    if (!confirm('Tem certeza que deseja excluir esta matéria? Todas as atividades dentro dela também serão removidas.')) {
        return;
    }

    // Remove a matéria
    materias = materias.filter(m => m.id !== materiaAtual);

    // Remove todas as atividades vinculadas
    atividades = atividades.filter(a => a.materiaId !== materiaAtual);

    salvarDados();
    renderizarMaterias();
    fecharModal('modalPasta');
    mostrarToast('Matéria excluída com sucesso!', 'sucesso');
    materiaAtual = null;
}

// --------------------------------------------
// RENDERIZAR ATIVIDADES
// --------------------------------------------
function renderizarAtividades(materiaId) {
    const container = document.getElementById('listaAtividades');
    const msgVazio = document.getElementById('semAtividades');

    container.innerHTML = '';

    const atividadesMateria = atividades.filter(a => a.materiaId === materiaId);

    if (atividadesMateria.length === 0) {
        msgVazio.style.display = 'block';
        return;
    }

    msgVazio.style.display = 'none';

    // Ordena por data mais recente primeiro
    atividadesMateria.sort((a, b) => new Date(b.dataEntrada) - new Date(a.dataEntrada));

    atividadesMateria.forEach(atividade => {
        const card = document.createElement('div');
        card.className = 'card-atividade';

        let botoesArquivo = '';
        if (atividade.arquivoBase64) {
            botoesArquivo = `
                <a href="${atividade.arquivoBase64}" download="${escapeHtml(atividade.nomeArquivo)}" class="btn btn-primary btn-pequeno">📥 Baixar PDF</a>
            `;
        }

        card.innerHTML = `
            <div class="card-atividade-info">
                <h4>${escapeHtml(atividade.titulo)}</h4>
                <p>${escapeHtml(atividade.descricao || 'Sem descrição')}</p>
                <span class="data">📅 Adicionado em: ${formatarData(atividade.dataEntrada)}</span>
            </div>
            <div class="card-atividade-acoes">
                ${botoesArquivo}
                <button onclick="excluirAtividade('${atividade.id}')" class="btn btn-perigo btn-pequeno">🗑 Excluir</button>
            </div>
        `;

        container.appendChild(card);
    });
}

// --------------------------------------------
// ADICIONAR ATIVIDADE
// --------------------------------------------
function adicionarAtividade(event) {
    event.preventDefault();

    if (!materiaAtual) {
        mostrarToast('Erro: nenhuma matéria selecionada.', 'erro');
        return;
    }

    const titulo = document.getElementById('tituloAtividade').value.trim();
    const descricao = document.getElementById('descricaoAtividade').value.trim();
    const arquivoInput = document.getElementById('arquivoAtividade');

    if (!titulo) {
        mostrarToast('O título da atividade é obrigatório!', 'erro');
        return;
    }

    const novaAtividade = {
        id: gerarId(),
        materiaId: materiaAtual,
        titulo: titulo,
        descricao: descricao,
        arquivoBase64: null,
        nomeArquivo: null,
        dataEntrada: obterDataAtual()
    };

    // Processa arquivo PDF se houver
    if (arquivoInput.files && arquivoInput.files[0]) {
        const arquivo = arquivoInput.files[0];

        // Verifica se é PDF
        if (arquivo.type !== 'application/pdf') {
            mostrarToast('Apenas arquivos PDF são permitidos!', 'erro');
            return;
        }

        // Verifica tamanho (limite de ~2MB para localStorage)
        if (arquivo.size > 2 * 1024 * 1024) {
            mostrarToast('Arquivo muito grande! Limite de 2MB.', 'erro');
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            novaAtividade.arquivoBase64 = e.target.result;
            novaAtividade.nomeArquivo = arquivo.name;

            atividades.push(novaAtividade);
            salvarDados();
            renderizarAtividades(materiaAtual);
            renderizarMaterias(); // Atualiza contador no card

            fecharModal('modalAtividade');
            mostrarToast('Atividade adicionada com sucesso!', 'sucesso');
        };
        reader.readAsDataURL(arquivo);
    } else {
        // Sem arquivo
        atividades.push(novaAtividade);
        salvarDados();
        renderizarAtividades(materiaAtual);
        renderizarMaterias();

        fecharModal('modalAtividade');
        mostrarToast('Atividade adicionada com sucesso!', 'sucesso');
    }
}

// --------------------------------------------
// EXCLUIR ATIVIDADE
// --------------------------------------------
function excluirAtividade(id) {
    if (!confirm('Deseja realmente excluir esta atividade?')) {
        return;
    }

    atividades = atividades.filter(a => a.id !== id);
    salvarDados();
    renderizarAtividades(materiaAtual);
    renderizarMaterias(); // Atualiza contador
    mostrarToast('Atividade excluída!', 'sucesso');
}

// --------------------------------------------
// FORMULÁRIO DE CONTATO
// --------------------------------------------
function enviarContato(event) {
    event.preventDefault();

    const nome = document.getElementById('nomeContato').value.trim();
    const email = document.getElementById('emailContato').value.trim();
    const assunto = document.getElementById('assuntoContato').value;
    const mensagem = document.getElementById('mensagemContato').value.trim();

    // Validação
    if (!nome || !email || !assunto || !mensagem) {
        mostrarFeedbackContato('Preencha todos os campos obrigatórios!', 'erro');
        return;
    }

    // Validação simples de e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        mostrarFeedbackContato('Por favor, insira um e-mail válido!', 'erro');
        return;
    }

    // Simula envio (site estático, sem backend)
    mostrarFeedbackContato(`Obrigado, ${nome}! Sua mensagem foi recebida. (Simulação - site estático)`, 'sucesso');
    document.getElementById('formContato').reset();
}

function mostrarFeedbackContato(mensagem, tipo) {
    const feedback = document.getElementById('msgContato');
    feedback.textContent = mensagem;
    feedback.className = 'mensagem-feedback ' + tipo;

    // Esconde após 5 segundos
    setTimeout(() => {
        feedback.className = 'mensagem-feedback';
    }, 5000);
}

// --------------------------------------------
// TOAST / MENSAGENS DE FEEDBACK
// --------------------------------------------
function mostrarToast(mensagem, tipo) {
    const toast = document.getElementById('toast');
    toast.textContent = mensagem;
    toast.className = 'toast ' + tipo;

    // Força reflow para reiniciar animação
    void toast.offsetWidth;

    toast.classList.add('ativo');

    setTimeout(() => {
        toast.classList.remove('ativo');
    }, 3000);
}

// --------------------------------------------
// CONFIGURAR EVENTOS
// --------------------------------------------
function configurarEventos() {
    // Botão Nova Matéria
    document.getElementById('btnNovaMateria').addEventListener('click', () => {
        abrirModal('modalMateria');
    });

    // Formulário de Matéria
    document.getElementById('formMateria').addEventListener('submit', adicionarMateria);

    // Botão Nova Atividade (dentro da pasta)
    document.getElementById('btnNovaAtividade').addEventListener('click', () => {
        abrirModal('modalAtividade');
    });

    // Botão Excluir Matéria
    document.getElementById('btnExcluirMateria').addEventListener('click', excluirMateriaAtual);

    // Formulário de Atividade
    document.getElementById('formAtividade').addEventListener('submit', adicionarAtividade);

    // Formulário de Contato
    document.getElementById('formContato').addEventListener('submit', enviarContato);
}

// --------------------------------------------
// UTILITÁRIO: ESCAPAR HTML (prevenir XSS)
// --------------------------------------------
function escapeHtml(texto) {
    if (!texto) return '';
    const div = document.createElement('div');
    div.textContent = texto;
    return div.innerHTML;
}
