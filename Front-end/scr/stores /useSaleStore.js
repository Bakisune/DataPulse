import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    signInAnonymously, 
    signInWithCustomToken 
} from 'firebase/auth';
import { 
    getFirestore, 
    collection, 
    onSnapshot, 
    doc,
    deleteDoc,
    writeBatch,
    getDocs
} from 'firebase/firestore';

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null;
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

let db;
let auth;
let userId = 'anonymous'; 

const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const formatDate = (isoString) => {
    try {
        if (!isoString) return 'N/A';
        const date = new Date(isoString); 
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch (e) {
        console.error("Erro ao formatar data:", e);
        return 'Data Inválida';
    }
};

const getMockSales = () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(today.getDate() - 2);

    return [
        { 
            id_venda: "V001", id_produto: 1, nome_produto: "Cadeira Ergonômica Pro", 
            id_cliente: 101, nome_cliente: "João Silva", quantidade: 1, 
            valor_unitario: 1250.00, data_venda: yesterday.toISOString()
        },
        { 
            id_venda: "V002", id_produto: 2, nome_produto: "Mouse Gamer Óptico", 
            id_cliente: 102, nome_cliente: "Maria Souza", quantidade: 3, 
            valor_unitario: 150.99, data_venda: today.toISOString()
        },
        { 
            id_venda: "V003", id_produto: 3, nome_produto: "Monitor Ultra Wide 4K", 
            id_cliente: 103, nome_cliente: "Carlos Ferreira", quantidade: 1, 
            valor_unitario: 3500.00, data_venda: twoDaysAgo.toISOString()
        },
        { 
            id_venda: "V004", id_produto: 4, nome_produto: "Teclado Mecânico RGB", 
            id_cliente: 104, nome_cliente: "Ana Costa", quantidade: 5, 
            valor_unitario: 450.50, data_venda: today.toISOString()
        },
        { 
            id_venda: "V005", id_produto: 1, nome_produto: "Cadeira Ergonômica Pro", 
            id_cliente: 105, nome_cliente: "Paulo Gomes", quantidade: 2, 
            valor_unitario: 1250.00, data_venda: yesterday.toISOString()
        },
    ];
};


async function initialDataSetup() {
    if (!db) {
        console.error("ERRO FIREBASE (Setup): Firestore não está inicializado para setup de dados mock.");
        return;
    }
    
    const salesCollectionRef = collection(db, `artifacts/${appId}/public/data/sales`);

    const snapshot = await getDocs(salesCollectionRef);
    if (!snapshot.empty) {

        const deleteBatch = writeBatch(db);
        snapshot.docs.forEach(doc => {
            deleteBatch.delete(doc.ref);
        });
        try {
            await deleteBatch.commit();
        } catch (e) {
             console.error("ERRO FIREBASE (Setup): Erro ao limpar dados mock existentes:", e);
        }
    }

    const mockSales = getMockSales();
    const insertBatch = writeBatch(db);

    mockSales.forEach(sale => {
        const docRef = doc(salesCollectionRef, sale.id_venda);
        insertBatch.set(docRef, sale);
    });

    try {
        await insertBatch.commit();
    } catch (e) {
        console.error("ERRO FIREBASE (Setup): Erro ao escrever dados mock (Verifique a regra 'allow write' da coleção 'sales'):", e);
    }
}


export const useSalesStore = defineStore('sales', () => {
    const sales = ref([]);
    const searchTerm = ref('');
    const activeSorts = ref([]); 
    const isLoading = ref(true);

    const filteredSales = computed(() => {
        if (!searchTerm.value) {
            return sales.value;
        }

        const term = searchTerm.value.toLowerCase();

        return sales.value.filter(sale => {

            const nomeProduto = sale.nome_produto?.toLowerCase() || '';
            const nomeCliente = sale.nome_cliente?.toLowerCase() || '';
            const idVenda = sale.id_venda?.toLowerCase() || '';
            const idProduto = String(sale.id_produto_or_placeholder) || '';
            const idCliente = String(sale.id_cliente_or_placeholder) || '';

            return (
                nomeProduto.includes(term) ||
                nomeCliente.includes(term) ||
                idVenda.includes(term) ||
                idProduto.includes(term) ||
                idCliente.includes(term)
            );
        });
    });

    const filteredAndSortedSales = computed(() => {
        let currentSales = [...filteredSales.value];

        if (activeSorts.value.length === 0) {
            return currentSales.sort((a, b) => new Date(b.data_venda).getTime() - new Date(a.data_venda).getTime());
        }

        currentSales.sort((a, b) => {
            for (const sort of activeSorts.value) {
                const key = sort.key;
                const dir = sort.direction === 'asc' ? 1 : -1;

                let valA, valB;
                
                if (key === 'data_venda') {
                    valA = new Date(a.data_venda).getTime();
                    valB = new Date(b.data_venda).getTime();
                } else if (key === 'quantidade') {
                    valA = a.quantidade;
                    valB = b.quantidade;
                } else if (key === 'total_venda') {
                    valA = a.total_venda;
                    valB = b.total_venda;
                } else {
                    return 0;
                }

                if (valA < valB) return -1 * dir;
                if (valA > valB) return 1 * dir;
            }
            return 0;
        });

        return currentSales;
    });
    
    function transformSale(data) {
        const unitario = data.valor_unitario || 0;
        const quantidade = data.quantidade || 0;
        const totalVenda = quantidade * unitario;

        const idCliente = data.id_cliente || '#N/A';
        const idProduto = data.id_produto || '#N/A';

        return {
            id_venda: data.id_venda,
            data_venda: data.data_venda,
            quantidade: quantidade,
            valor_unitario: unitario,
            total_venda: totalVenda, 
            
            nome_produto: data.nome_produto || 'Produto Desconhecido',
            nome_cliente: data.nome_cliente || 'Cliente Anônimo',
            id_produto_or_placeholder: idProduto,
            id_cliente_or_placeholder: idCliente,
            
            produto: {
                id: idProduto,
                nome: data.nome_produto
            },
            cliente: {
                id: idCliente,
                nome: data.nome_cliente
            },

            data_venda_formatted: formatDate(data.data_venda),
            unitarioFormatted: formatCurrency(unitario),
            totalFormatted: formatCurrency(totalVenda),
        };
    }
    
    async function fetchSales() {
        if (!firebaseConfig) {
            console.error("ERRO FIREBASE (Init): Configuração do Firebase faltando. Usando DADOS MOCK para continuar o desenvolvimento.");
            const mockSales = getMockSales();
            sales.value = mockSales.map(transformSale);
            isLoading.value = false;
            return;
        }

        try {
            const app = initializeApp(firebaseConfig);
            db = getFirestore(app);
            auth = getAuth(app);
            
            if (initialAuthToken) {
                await signInWithCustomToken(auth, initialAuthToken);
            } else {
                await signInAnonymously(auth);
            }
            userId = auth.currentUser.uid;
            
            await initialDataSetup();

            const salesCollectionRef = collection(db, `artifacts/${appId}/public/data/sales`);

            onSnapshot(salesCollectionRef, (snapshot) => {
                const fetchedSales = [];
                snapshot.forEach((doc) => {
                    fetchedSales.push(transformSale(doc.data()));
                });

                sales.value = fetchedSales;
                isLoading.value = false; 
                
                if (fetchedSales.length === 0) {
                    console.warn("ATENÇÃO: Leitura retornou 0 documentos. Se você acabou de inicializar, pode ser normal. Se persistir, VERIFIQUE as REGRAS DE SEGURANÇA do Firestore para a coleção 'sales' (allow read).");
                }

            }, (error) => {
                console.error("ERRO CRÍTICO FIREBASE (onSnapshot): FALHA AO LER DADOS. O problema é quase certeza REGRAS DE SEGURANÇA. Certifique-se de que a regra 'allow read' está configurada corretamente para a coleção 'sales':", error);
                isLoading.value = false;
            });
            
        } catch (e) {
            console.error("ERRO FATAL (Init): Erro na inicialização do Firebase/Autenticação:", e);
            isLoading.value = false;
        }
    }

    function setSort({ key }) {
        const existingSort = activeSorts.value.find(s => s.key === key);

        if (!existingSort) {
            activeSorts.value = [{ key, direction: 'desc' }];
        } else if (existingSort.direction === 'desc') {
            activeSorts.value = [{ key, direction: 'asc' }];
        } else {
            activeSorts.value = [];
        }
    }

    function clearFilters() {
        searchTerm.value = '';
        activeSorts.value = [];
    }

    async function deleteSale(idVenda) {
        if (!db) return console.error("Firestore não inicializado.");
        try {
            const docRef = doc(db, `artifacts/${appId}/public/data/sales`, idVenda);
            await deleteDoc(docRef);
        } catch (e) {
            console.error(`Erro ao deletar a venda ${idVenda}:`, e);
        }
    }

    fetchSales();

    return {
        sales,
        searchTerm,
        activeSorts,
        isLoading,

        filteredSales,
        filteredAndSortedSales,

        setSort,
        clearFilters,
        deleteSale,
    };
});
