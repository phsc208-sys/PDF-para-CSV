// --- CARREGAMENTO E NAVEGAÇÃO ---

async function carregarPDF(input) {
    if (!input.files[0]) return;
    const buffer = await input.files[0].arrayBuffer();
    pdfDoc = await pdfjsLib.getDocument(buffer).promise;
    totalPags = pdfDoc.numPages;
    
    // Reset Geral
    pagAtual = 1;
    regioes = [];
    planilhasSalvas = []; 
    atualizarContadorPlanilhas();
    
    // Atualiza o total de páginas na tela
    const totalEl = document.getElementById('totalPags');
    if(totalEl) totalEl.innerText = totalPags;
    
    limparTudo();
    await carregarPagina(pagAtual);
}

async function mudarPag(delta) {
    if (!pdfDoc) return;
    const nova = pagAtual + delta;
    if (nova >= 1 && nova <= totalPags) {
        pagAtual = nova;
        await carregarPagina(pagAtual);
    }
}

// FUNÇÃO RESTAURADA: Ir para página ao digitar
async function irParaPagina() {
    if (!pdfDoc) return;
    
    const input = document.getElementById('pagInput');
    let valor = parseInt(input.value);

    if (valor >= 1 && valor <= totalPags) {
        pagAtual = valor;
        await carregarPagina(pagAtual);
    } else {
        input.value = pagAtual; // Se inválido, volta
    }
}

async function carregarPagina(num) {
    // Atualiza o input com o número da página
    const input = document.getElementById('pagInput');
    if(input) input.value = num;
    
    const page = await pdfDoc.getPage(num);
    const viewport = page.getViewport({ scale: 1.0 });
    alturaPagina = viewport.height;
    const content = await page.getTextContent();

    const ws = document.getElementById('workspace');
    
    // Correção Bootstrap: Remove d-flex para esconder msg
    const msg = document.getElementById('msgInicial');
    if(msg) {
        msg.classList.remove('d-flex');
        msg.style.display = 'none';
    }

    let container = document.getElementById('page-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'page-container';
        container.style.position = 'relative';
        container.style.backgroundColor = 'white';
        container.style.boxShadow = '0 0 20px rgba(0,0,0,0.5)';
        ws.appendChild(container);
    }

    container.style.width = (viewport.width * escala) + "px";
    container.style.height = (viewport.height * escala) + "px";

    itensPaginaAtual = content.items.map(i => ({ 
        str: i.str, 
        x: i.transform[4], 
        y: i.transform[5] 
    }));
    
    recalcularLinhas();
    desenharLimites();
}