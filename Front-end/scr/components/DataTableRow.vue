<script setup>
import { computed, defineProps, ref, defineEmits, Teleport } from 'vue';
import { useSalesStore } from '../stores/useSaleStore'; 

const props = defineProps({
    item: {
        type: Object,
        required: true,
    }
});

const emit = defineEmits(['edit', 'delete']);

const isDeleting = ref(false);

const salesStore = useSalesStore();

const rowClasses = computed(() => {
    return [
        'flex items-center text-sm',
        'bg-white hover:bg-indigo-50/50 border-b border-gray-100 transition duration-150',
        'text-gray-700'
    ];
});

const totalValueClasses = computed(() => {
    return 'text-lg font-extrabold text-indigo-600'; 
});

const handleEdit = () => emit('edit', props.item.id_venda);

const confirmDelete = () => {
    isDeleting.value = true;
};

const cancelDelete = () => {
    isDeleting.value = false;
};

const executeDelete = async () => {
    await salesStore.deleteSale(props.item.id_venda);
    isDeleting.value = false;
    emit('delete', props.item.id_venda);
};

</script>

<template>
    <template v-if="item">
        <div :class="rowClasses" class="px-6" @click.stop>
            
            <div class="w-2/12 pr-8 min-w-[150px] text-left py-3 flex items-center">
                <i class="bi bi-box-seam text-indigo-500 mr-3 text-lg hidden sm:block"></i>
                <div class="flex flex-col">
                    <span class="font-semibold text-base leading-tight">{{ item.nome_produto }}</span>
                    <span class="text-xs text-gray-500 leading-tight">ID Prod: #{{ item.id_produto_or_placeholder }}</span>
                </div>
            </div>

            <div class="w-2/12 pl-4 pr-3 min-w-[100px] text-left py-3">
                <div class="flex flex-col">
                    <span class="font-medium text-base leading-tight">{{ item.data_venda_formatted }}</span>
                    <span class="text-xs text-gray-500 leading-tight">Venda: #{{ item.id_venda }}</span>
                </div>
            </div>
            
            <div class="w-2/12 pl-4 pr-5 min-w-[120px] text-left py-3">
                <div class="flex flex-col">
                    <span class="font-medium leading-tight">{{ item.nome_cliente }}</span>
                    <span class="text-xs text-gray-500 leading-tight">Cliente ID: #{{ item.id_cliente_or_placeholder }}</span>
                </div>
            </div>

            <div class="w-1/12 px-3 text-center min-w-[50px] font-bold text-gray-700 py-3">
                <span class="text-base font-bold text-gray-600">{{ item.quantidade }}</span>
            </div>
            
            <div class="w-2/12 pr-5 text-left min-w-[100px] text-gray-600 py-3" style="padding-left: 5.8rem;">
                <span class="text-sm font-medium">{{ item.unitarioFormatted }}</span>
            </div>

            <div class="w-2/12 text-left pr-5 min-w-[100px] py-3" style="padding-left: 6.2rem;">
                <span :class="totalValueClasses">{{ item.totalFormatted }}</span>
            </div>

            <div class="w-1/12 text-right pl-4 pr-0 min-w-[80px] py-3 flex justify-end space-x-2">
                <button 
                    @click.stop="handleEdit" 
                    title="Editar Venda"
                    class="p-1 text-gray-500 hover:text-indigo-600 transition duration-150 rounded-md hover:bg-gray-100"
                >
                    <i class="bi bi-pencil-square text-lg"></i>
                </button>
                <button 
                    @click.stop="confirmDelete" 
                    title="Excluir Venda"
                    class="p-1 text-gray-500 hover:text-red-500 transition duration-150 rounded-md hover:bg-gray-100"
                >
                    <i class="bi bi-trash-fill text-lg"></i>
                </button>
            </div>
        </div>

        <Teleport to="body">
            <div v-if="isDeleting" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div class="bg-white p-6 rounded-xl shadow-2xl max-w-sm w-full transform transition-all duration-300 scale-100">
                    <h3 class="text-lg font-bold text-red-600 mb-4 flex items-center">
                        <i class="bi bi-exclamation-triangle-fill mr-2"></i> Confirmar Exclusão
                    </h3>
                    <p class="text-gray-700 mb-6">
                        Tem certeza que deseja deletar a venda <span class="font-bold">{{ item.id_venda }}</span>? Esta ação não pode ser desfeita.
                    </p>
                    <div class="flex justify-end space-x-3">
                        <button 
                            @click="cancelDelete"
                            class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition duration-150"
                        >
                            Cancelar
                        </button>
                        <button 
                            @click="executeDelete"
                            class="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition duration-150 shadow-md"
                        >
                            Deletar
                        </button>
                    </div>
                </div>
            </div>
        </Teleport>
    </template>
</template>
