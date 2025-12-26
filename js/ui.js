// --- INTERFACE DE USUÁRIO (UI) ---

// 1. FILTRO VISUAL
function recalcularLinhas() {
    if (!itensPaginaAtual || itensPaginaAtual.length === 0) return;
    const tol = parseInt(document.getElementById('tolerancia').value);
    document.getElementById('tolVal').innerText = tol + "px";

    let mostrarTudo = regioes.length === 0;

    let itensFiltrados = itensPaginaAtual.filter(item => {
        if (mostrarTudo) return true;
        const yVisual = (alturaPagina - item.y) * escala;
        let dentro = false;

        for (let reg of regioes) {
            let startOk = true; 
            let endOk = true;
            if (reg.inicio) {
                if (pagAtual < reg.inicio.pag) startOk = false;
                if (pagAtual === reg.inicio.pag && yVisual < (reg.inicio.y - 5)) startOk = false;
            }
            if (reg.fim) {
                if (pagAtual > reg.fim.pag) endOk = false;
                if (pagAtual === reg.fim.pag && yVisual > (reg.fim.y + 5)) endOk = false;
            }
            if (startOk && endOk) { dentro = true; break; }
        }
        return dentro;
    });

    itensFiltrados.sort((a,b) => b.y - a.y);
    
    let linhasVisuais = [];
    if (itensFiltrados.length > 0) {
        let atual = { base: itensFiltrados[0].y, topo: itensFiltrados[0].y, itens: [itensFiltrados[0]] };
        for(let i=1; i<itensFiltrados.length; i++) {
            const item = itensFiltrados[i];
            if (Math.abs(atual.base - item.y) <= tol) {
                atual.itens.push(item);
                if (item.y < atual.base) atual.base = item.y;
            } else {
                linhasVisuais.push(atual);
                atual = { base: item.y, topo: item.y, itens: [item] };
            }
        }
        linhasVisuais.push(atual);
    }
    desenharWorkspace(linhasVisuais);
}

function desenharWorkspace(linhas) {
    const container = document.getElementById('page-container');
    if(!container) return;

    const cols = document.querySelectorAll('.col-sep');
    const limits = document.querySelectorAll('.limit-line');
    
    container.innerHTML = ""; 
    cols.forEach(c => container.appendChild(c));
    limits.forEach(l => container.appendChild(l));

    if(!linhas) return;

    linhas.forEach(linha => {
        const div = document.createElement('div');
        div.className = 'pdf-row';
        const yTela = (alturaPagina - linha.topo) * escala;
        const hTela = (linha.topo - linha.base) * escala + 12;
        div.style.top = yTela + "px"; div.style.height = hTela + "px";
        
        linha.itens.forEach(item => {
            const span = document.createElement('span');
            span.className = 'pdf-item';
            span.innerText = item.str;
            span.style.left = (item.x * escala) + "px";
            span.style.top = (((alturaPagina - item.y) * escala) - yTela) + "px";
            div.appendChild(span);
        });
        container.appendChild(div);
    });
}

// 2. INTERAÇÃO E CLIQUES
function ativarModo(modo) {
    modoFerramenta = modo;
    document.getElementById('btnTop').className = modo==='top' ? 'btn-tool active-top' : 'btn-tool';
    document.getElementById('btnBottom').className = modo==='bottom' ? 'btn-tool active-bottom' : 'btn-tool';
}

function cliqueWorkspace(e) {
    if(e.target.classList.contains('col-sep') || e.target.classList.contains('limit-line')) return;

    const container = document.getElementById('page-container');
    if(!container) return;
    const x = e.clientX - container.getBoundingClientRect().left;
    const y = e.clientY - container.getBoundingClientRect().top;

    if (modoFerramenta === 'top') {
        let ultima = regioes.length > 0 ? regioes[regioes.length - 1] : null;
        if (!ultima || (ultima.inicio && ultima.fim)) {
            regioes.push({ id: regioes.length + 1, inicio: { pag: pagAtual, y: y }, fim: null });
        } else {
            ultima.inicio = { pag: pagAtual, y: y };
        }
        modoFerramenta = null;
        document.getElementById('btnTop').className = 'btn-tool';
        desenharLimites(); recalcularLinhas();
    } 
    else if (modoFerramenta === 'bottom') {
        let ultima = regioes.length > 0 ? regioes[regioes.length - 1] : null;
        if (ultima) {
            ultima.fim = { pag: pagAtual, y: y };
        } else {
            alert("Defina o Início primeiro!");
        }
        modoFerramenta = null;
        document.getElementById('btnBottom').className = 'btn-tool';
        desenharLimites(); recalcularLinhas();
    } 
    else {
        // Coluna (com proteção de duplo clique)
        let perto = false;
        document.querySelectorAll('.col-sep').forEach(c => { if(Math.abs(parseFloat(c.style.left)-x)<10) perto=true; });
        if(!perto) {
            const l = document.createElement('div');
            l.className = 'col-sep'; l.style.left = x + "px";
            l.title = "Clique para remover";
            l.onclick = (evt) => { evt.stopPropagation(); l.remove(); };
            container.appendChild(l);
        }
    }
}

function desenharLimites() {
    const container = document.getElementById('page-container');
    if(!container) return;
    document.querySelectorAll('.limit-line').forEach(e => e.remove());

    regioes.forEach((reg, index) => {
        if (reg.inicio && reg.inicio.pag === pagAtual) {
            let l = document.createElement('div');
            l.className = 'limit-line limit-top';
            l.style.top = reg.inicio.y + "px";
            l.innerHTML = `<span class="limit-tag" style="background:#27ae60">INÍCIO ${reg.id}</span>`;
            l.onclick = (e) => { e.stopPropagation(); if(confirm("Apagar bloco?")) { regioes.splice(index,1); desenharLimites(); recalcularLinhas(); } };
            container.appendChild(l);
        }
        if (reg.fim && reg.fim.pag === pagAtual) {
            let l = document.createElement('div');
            l.className = 'limit-line limit-bottom';
            l.style.top = reg.fim.y + "px";
            l.innerHTML = `<span class="limit-tag" style="background:#e74c3c">FIM ${reg.id}</span>`;
            l.onclick = (e) => { e.stopPropagation(); if(confirm("Apagar bloco?")) { regioes.splice(index,1); desenharLimites(); recalcularLinhas(); } };
            container.appendChild(l);
        }
    });
}

function limparTudo(limparRegioes = true) {
    document.querySelectorAll('.col-sep').forEach(e => e.remove());
    if (limparRegioes) regioes = [];
    desenharLimites();
    recalcularLinhas();
}

// --- FUNÇÃO DE SALVAR PLANILHA (NOVA) ---
async function salvarPlanilhaAtual() {
    // Extrai os dados da configuração atual
    const dados = await extrairDadosGerais();
    
    if (!dados || dados.dados.length === 0) {
        alert("A planilha atual está vazia ou não foi configurada corretamente.");
        return;
    }

    const nome = prompt("Nome desta planilha (aba do Excel):", `Planilha ${planilhasSalvas.length + 1}`);
    if (!nome) return;

    // Salva na memória
    planilhasSalvas.push({
        nome: nome,
        dados: dados.dados, // Matriz de dados
        colunas: dados.numColunas
    });

    atualizarContadorPlanilhas();
    
    // Limpa a tela para a próxima planilha
    if(confirm("Planilha salva! Deseja limpar a tela para configurar a próxima?")) {
        limparTudo(true); // Limpa colunas e regiões
    }
}

function atualizarContadorPlanilhas() {
    const div = document.getElementById('contadorPlanilhas');
    if (planilhasSalvas.length > 0) {
        div.style.display = 'block';
        div.innerText = `${planilhasSalvas.length} Planilha(s) Pronta(s)`;
    } else {
        div.style.display = 'none';
    }
}