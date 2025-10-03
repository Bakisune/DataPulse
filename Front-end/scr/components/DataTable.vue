<script setup>
import { ref, computed } from 'vue';
import { useSalesStore } from '../stores/useSaleStore.js';
import DataTableRow from './DataTableRow.vue';
import PaginationControls from './PaginationControls.vue';
import SearchBar from './SearchBar.vue';

const store = useSalesStore();

const salesData = computed(() => store.filteredAndSortedSales || []);

const hasActiveFilter = computed(() => store.searchTerm.length > 0 || store.activeSorts.length > 0);

const getSortState = (key) => store.activeSorts.find(s => s.key === key);

const itemsPerPage = 4;
const currentPage = ref(1);

const totalPages = computed(() => {
    if (salesData.value.length === 0) return 1;
    return Math.ceil(salesData.value.length / itemsPerPage);
});

const paginatedSales = computed(() => {
    if (currentPage.value > 1 && totalPages.value < currentPage.value) {
        currentPage.value = 1;
    }

    const start = (currentPage.value - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return salesData.value.slice(start, end);
});

const handleClearFilters = () => {
    store.clearFilters();
    currentPage.value = 1;
};

const sortByTotal = () => {
    store.setSort({ key: 'total_venda' });
    currentPage.value = 1;
};

const sortByDate = () => {
    store.setSort({ key: 'data_venda' });
    currentPage.value = 1;
};

const nextPage = () => {
    if (currentPage.value < totalPages.value) currentPage.value++;
};

const prevPage = () => {
    if (currentPage.value > 1) currentPage.value--;
};

const editItem = (id) => console.log(`[DataTable] Ação de Edição para o ID: ${id}`);
const reportError = () => console.log('Erro reportado (simulação)');
const downloadDashboard = () => console.log('Dashboard baixado (simulação)');

const deleteItem = (id) => {
    if (currentPage.value > totalPages.value) {
        currentPage.value = Math.max(1, totalPages.value);
    }
};
</script>

<template>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
    
    <div
        class="bg-white text-gray-800 shadow-2xl rounded-xl max-w-7xl mx-auto min-w-[900px] border border-gray-100 flex flex-col">
        
        <div class="px-6 pt-5 pb-3 flex justify-between items-center border-b border-gray-200">
            
            <div class="flex space-x-2 items-center">
                
                <button 
                    @click="sortByTotal" 
                    :class="['flex items-center px-4 py-2 rounded-lg font-semibold text-sm transition duration-150',
                    getSortState('total_venda') ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-100 text-gray-700 hover:bg-gray-200']">
                    Maiores Vendas
                    <i v-if="getSortState('total_venda')" 
                        :class="['ml-2 bi', 
                        getSortState('total_venda').direction === 'desc' ? 'bi-sort-down-alt' : 'bi-sort-up-alt',
                        'text-lg']">
                    </i>
                </button>
                
                <button 
                    @click="sortByDate" 
                    :class="['flex items-center px-4 py-2 rounded-lg font-semibold text-sm transition duration-150',
                    getSortState('data_venda') ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-100 text-gray-700 hover:bg-gray-200']">
                    Mais Recentes
                    <i v-if="getSortState('data_venda')" 
                        :class="['ml-2 bi', 
                        getSortState('data_venda').direction === 'desc' ? 'bi-sort-down-alt' : 'bi-sort-up-alt',
                        'text-lg']">
                    </i>
                </button>

                <button 
                    v-if="hasActiveFilter" 
                    @click="handleClearFilters" 
                    class="flex items-center px-4 py-2 rounded-lg font-semibold text-sm bg-red-500 text-white hover:bg-red-600 transition duration-150 shadow-md">
                    <i class="bi bi-x-lg mr-1"></i>
                    Limpar Filtros
                </button>
            </div>
            
            <SearchBar v-model:searchTerm="store.searchTerm" />
        </div>

        <div
            class="flex px-6 py-3 border-b border-gray-200 font-bold text-gray-500 text-xs uppercase tracking-widest bg-white sticky top-0 z-10">
            <div class="w-2/12 pr-8 min-w-[150px] text-left whitespace-nowrap">NOME DO PRODUTO</div>
            <div class="w-2/12 pl-4 pr-3 min-w-[100px] text-left whitespace-nowrap">DATA DA VENDA</div>
            <div class="w-2/12 pl-4 pr-5 min-w-[120px] text-left whitespace-nowrap">NOME DO CLIENTE</div>
            <div class="w-1/12 px-3 text-center min-w-[50px] whitespace-nowrap">QUANTIDADE</div>
            <div class="w-2/12 pl-4 pr-5 text-right min-w-[100px] whitespace-nowrap">VALOR UNITÁRIO</div>
            <div class="w-2/12 text-right pl-4 pr-5 min-w-[100px] whitespace-nowrap">VALOR TOTAL</div>
            <div class="w-1/12 text-right pl-4 pr-0 min-w-[80px] whitespace-nowrap"></div>
        </div>


        <div class="flex-grow px-6 py-4 flex flex-col justify-between min-h-[250px]">
            <div v-if="store.isLoading" class="text-center py-10 text-indigo-600 text-lg">
                <i class="bi bi-arrow-clockwise animate-spin mr-2"></i>
                Carregando dados...
            </div>
            
            <div v-else class="space-y-3">
                
                <template v-for="item in paginatedSales" :key="item?.id_venda || 'temp-key-' + Math.random()">
                    <DataTableRow 
                        v-if="item && item.id_venda"
                        :item="item" 
                        @edit="editItem" 
                        @delete="deleteItem" />
                </template>

                <div v-if="salesData.length === 0" class="text-center py-10 text-gray-500 text-lg">
                    Nenhum dado de vendas disponível.
                </div>
            </div>
        </div>
        
        <div
            class="flex flex-col sm:flex-row justify-between items-center pl-6 pr-6 py-4 border-t border-gray-200 mt-0 bg-white rounded-b-xl">
            
            <div class="flex space-x-3 mb-4 sm:mb-0">
                <button 
                    @click="reportError" 
                    type="button" 
                    class="flex items-center px-4 py-2 bg-white text-red-500 font-semibold rounded-lg shadow-sm border border-red-300 hover:bg-red-50 transition duration-150 text-sm">
                    <i class="bi bi-exclamation-triangle-fill mr-2"></i>
                    Reportar Erro
                </button>
                <button 
                    @click="downloadDashboard" 
                    type="button"
                    class="flex items-center px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition duration-150 text-sm">
                    <i class="bi bi-cloud-arrow-down-fill mr-2"></i>
                    Baixar Dashboard
                </button>
            </div>
            
            <PaginationControls 
                :currentPage="currentPage" 
                :totalPages="totalPages" 
                :disabled="!salesData.length || store.isLoading" 
                @prev="prevPage" 
                @next="nextPage" 
            />
        </div>
    </div>
</template>
