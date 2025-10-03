<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
    searchTerm: {
        type: String,
        default: ''
    }
});

const emit = defineEmits(['update:searchTerm']);

const localSearchTerm = ref(props.searchTerm);

let timeoutId = null;

watch(localSearchTerm, (newTerm) => {
    if (timeoutId) {
        clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
        emit('update:searchTerm', newTerm);
    }, 200);
}, { immediate: true }); 


watch(() => props.searchTerm, (newPropTerm) => {
    if (newPropTerm !== localSearchTerm.value) {
        localSearchTerm.value = newPropTerm;
    }
});
</script>

<template>
    <div class="relative w-full max-w-xs sm:max-w-lg">
        <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <i class="bi bi-search text-gray-400 text-lg"></i>
        </div>
        <input 
            type="text"
            v-model="localSearchTerm"
            placeholder="Procure por Produto, Cliente ou ID/Código da Venda..."
            class="w-full pl-10 pr-4 py-2.5 text-gray-800 bg-gray-50 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 text-sm"
            aria-label="Campo de Busca"
        >
    </div>
</template>
