from flask import Flask, jsonify
import sqlite3
from datetime import datetime
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Isso permite que o front-end acesse a API

def conectar_banco():
    """Conecta ao banco de dados SQLite"""
    conn = sqlite3.connect('../BancoDeDados/vendas.db')
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/vendas', methods=['GET'])
def obter_vendas():
    """Endpoint para obter todas as vendas"""
    try:
        conn = conectar_banco()
        cursor = conn.cursor()
        
        # Consulta que combina informações das três tabelas
        query = '''
        SELECT 
            v.id as id_venda,
            v.data_venda,
            v.quantidade,
            p.id as produto_id,
            p.nome as produto_nome,
            p.valor_unitario,
            c.id as cliente_id,
            c.nome as cliente_nome,
            (v.quantidade * p.valor_unitario) as valor_total_venda
        FROM vendas v
        JOIN produtos p ON v.produto_id = p.id
        JOIN clientes c ON v.cliente_id = c.id
        ORDER BY v.data_venda DESC, v.id DESC
        '''
        
        cursor.execute(query)
        vendas = cursor.fetchall()
        
        resultado = []
        for venda in vendas:
            venda_dict = {
                'id_venda': venda['id_venda'],
                'data_venda': venda['data_venda'],
                'quantidade': venda['quantidade'],
                'produto': {
                    'id': venda['produto_id'],
                    'nome': venda['produto_nome'],
                    'valor_unitario': float(venda['valor_unitario'])
                },
                'cliente': {
                    'id': venda['cliente_id'],
                    'nome': venda['cliente_nome']
                },
                'valor_total_venda': float(venda['valor_total_venda'])
            }
            resultado.append(venda_dict)
        
        conn.close()
        return jsonify(resultado)
        
    except Exception as e:
        return jsonify({'erro': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Endpoint para verificar se a API está funcionando"""
    return jsonify({'status': 'API funcionando', 'timestamp': datetime.now().isoformat()})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)