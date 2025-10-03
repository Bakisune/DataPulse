<script setup>
const props = defineProps({
    currentPage: {
        type: Number,
        required: true
    },
    totalPages: {
        type: Number,
        required: true
    }
});

const emit = defineEmits(['prev', 'next']);

const prevPage = () => {
    emit('prev');
};

const nextPage = () => {
    emit('next');
};
</script>

<template>
    <div class="flex items-center space-x-2">
        
        <button 
            @click="prevPage"
            :disabled="currentPage === 1"
            :class="{ 'cursor-not-allowed text-gray-400 border-gray-300': currentPage === 1, 'text-gray-700 hover:bg-gray-100': currentPage > 1 }"
            class="w-8 h-8 flex items-center justify-center border bg-white rounded-full transition duration-150"
        >
            <i class="bi bi-chevron-left text-sm"></i>
        </button>
        
        <span class="font-bold text-gray-800 text-sm px-2 py-1 bg-indigo-100 rounded-full ring-1 ring-indigo-300">{{ currentPage }}</span>
        <span class="font-medium text-gray-600 text-sm">de {{ totalPages }}</span>
        
        <button 
            @click="nextPage"
            :disabled="currentPage === totalPages"
            :class="{ 'cursor-not-allowed text-gray-400 border-gray-300': currentPage === totalPages, 'text-gray-700 hover:bg-gray-100': currentPage < totalPages }"
            class="w-8 h-8 flex items-center justify-center border bg-white rounded-full transition duration-150"
        >
            <i class="bi bi-chevron-right text-sm"></i>
        </button>
    </div>
</template>
