<script setup>
import { defineProps, defineEmits, computed } from 'vue';

const props = defineProps({
    activeSorts: {
        type: Array,
        default: () => []
    },
    hasActiveFilter: { 
        type: Boolean,
        required: true
    }
});

const emit = defineEmits(['setSort', 'clear']);

const getSortState = computed(() => (criteria) => {
    return props.activeSorts.find(s => s.criteria === criteria);
});

const handleSort = (criteria) => {
    emit('setSort', criteria);
};

const handleClear = () => {
    emit('clear');
};
</script>

<template>
    <div class="flex space-x-3 items-center">
        
        <button 
            @click="handleSort('total')"
            :class="{
                'bg-indigo-600 text-white shadow-md': getSortState('total'), 
                'bg-gray-200 text-gray-700 hover:bg-gray-300': !getSortState('total')
            }"
            class="flex items-center px-4 py-2 font-semibold rounded-lg transition duration-150 text-sm"
        >
            Maiores Vendas
            <i v-if="getSortState('total')" 
               :class="{
                    'bi-sort-up-alt': getSortState('total').direction === 'DESC', 
                    'bi-sort-down-alt': getSortState('total').direction === 'ASC'
               }" 
               class="bi ml-2 text-base"></i>
        </button>
        
        <button 
            @click="handleSort('data')"
            :class="{
                'bg-indigo-600 text-white shadow-md': getSortState('data'), 
                'bg-gray-200 text-gray-700 hover:bg-gray-300': !getSortState('data')
            }"
            class="flex items-center px-4 py-2 font-semibold rounded-lg transition duration-150 text-sm"
        >
            Mais Recentes
            <i v-if="getSortState('data')" 
               :class="{
                    'bi-sort-up-alt': getSortState('data').direction === 'DESC', 
                    'bi-sort-down-alt': getSortState('data').direction === 'ASC'
               }" 
               class="bi ml-2 text-base"></i>
        </button>
        
        <button 
            v-if="hasActiveFilter"
            @click="handleClear"
            type="button" 
            class="flex items-center px-3 py-2 bg-red-100 text-red-600 font-semibold rounded-lg shadow-sm hover:bg-red-200 transition duration-150 text-sm"
        >
            <i class="bi bi-x-circle-fill mr-1"></i>
            Limpar Filtros
        </button>
    </div>
</template>
