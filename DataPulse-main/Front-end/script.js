class VendasManager {
    constructor() {
        this.vendas = [];
        this.filteredVendas = [];
        this.currentSort = { field: 'data_venda', direction: 'desc' };
        this.init();
    }

    async init() {
        await this.carregarVendas();
        this.setupEventListeners();
    }

    async carregarVendas() {
        try {
            const response = await fetch('http://localhost:5000/vendas');
            
            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }
            
            this.vendas = await response.json();
            this.filteredVendas = [...this.vendas];
            this.atualizarTabela();
            this.atualizarEstatisticas();
            
        } catch (error) {
            console.error('Erro ao carregar vendas:', error);
            this.mostrarErro('Erro ao carregar dados. Verifique se a API está rodando.');
        }
    }

    setupEventListeners() {
        // Busca em tempo real
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.filtrarVendas(e.target.value);
        });

        // Ordenação das colunas
        document.querySelectorAll('th[data-sort]').forEach(th => {
            th.addEventListener('click', () => {
                this.ordenarVendas(th.dataset.sort);
            });
        });
    }

    filtrarVendas(termo) {
        if (!termo) {
            this.filteredVendas = [...this.vendas];
        } else {
            const termoLower = termo.toLowerCase();
            this.filteredVendas = this.vendas.filter(venda => 
                venda.cliente.nome.toLowerCase().includes(termoLower) ||
                venda.produto.nome.toLowerCase().includes(termoLower)
            );
        }
        this.atualizarTabela();
        this.atualizarEstatisticas();
    }

    ordenarVendas(campo) {
        // Alterna a direção se clicar no mesmo campo
        if (this.currentSort.field === campo) {
            this.currentSort.direction = this.currentSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            this.currentSort.field = campo;
            this.currentSort.direction = 'asc';
        }

        this.filteredVendas.sort((a, b) => {
            let aVal, bVal;

            // Acessa campos aninhados
            if (campo === 'cliente_nome') {
                aVal = a.cliente.nome;
                bVal = b.cliente.nome;
            } else if (campo === 'produto_nome') {
                aVal = a.produto.nome;
                bVal = b.produto.nome;
            } else if (campo === 'valor_unitario') {
                aVal = a.produto.valor_unitario;
                bVal = b.produto.valor_unitario;
            } else if (campo === 'valor_total_venda') {
                aVal = a.valor_total_venda;
                bVal = b.valor_total_venda;
            } else {
                aVal = a[campo];
                bVal = b[campo];
            }

            // Converte para número se possível
            if (typeof aVal === 'string' && !isNaN(aVal)) {
                aVal = parseFloat(aVal);
                bVal = parseFloat(bVal);
            }

            if (aVal < bVal) return this.currentSort.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return this.currentSort.direction === 'asc' ? 1 : -1;
            return 0;
        });

        this.atualizarCabecalho();
        this.atualizarTabela();
    }

    atualizarCabecalho() {
        document.querySelectorAll('th[data-sort]').forEach(th => {
            th.classList.remove('sort-asc', 'sort-desc');
            if (th.dataset.sort === this.currentSort.field) {
                th.classList.add(`sort-${this.currentSort.direction}`);
            }
        });
    }

    atualizarTabela() {
        const tbody = document.getElementById('vendasBody');
        
        if (this.filteredVendas.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="no-data">Nenhuma venda encontrada</td></tr>';
            return;
        }

        tbody.innerHTML = this.filteredVendas.map(venda => `
            <tr>
                <td>${this.formatarData(venda.data_venda)}</td>
                <td>${venda.cliente.nome}</td>
                <td>${venda.produto.nome}</td>
                <td>${venda.quantidade}</td>
                <td class="valor">${this.formatarMoeda(venda.produto.valor_unitario)}</td>
                <td class="valor valor-total">${this.formatarMoeda(venda.valor_total_venda)}</td>
            </tr>
        `).join('');
    }

    atualizarEstatisticas() {
        const totalVendas = this.filteredVendas.length;
        const totalValor = this.filteredVendas.reduce((sum, venda) => sum + venda.valor_total_venda, 0);

        document.getElementById('totalVendas').textContent = totalVendas;
        document.getElementById('totalValor').textContent = this.formatarMoeda(totalValor);
    }

    formatarData(dataString) {
        const data = new Date(dataString);
        return data.toLocaleDateString('pt-BR');
    }

    formatarMoeda(valor) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor);
    }

    mostrarErro(mensagem) {
        const tbody = document.getElementById('vendasBody');
        tbody.innerHTML = `<tr><td colspan="6" class="error">${mensagem}</td></tr>`;
    }
}

// Inicializa a aplicação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    new VendasManager();
});