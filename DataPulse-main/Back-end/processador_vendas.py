import sqlite3
import os
import logging
from datetime import datetime

# Configuração do logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('processamento_vendas.log'),
        logging.StreamHandler()
    ]
)

class ProcessadorVendas:
    def __init__(self, db_path='../BancoDeDados/vendas.db'):
        self.db_path = db_path
        self.conectar_banco()
        self.criar_tabelas()
    
    def conectar_banco(self):
        """Conecta ao banco de dados SQLite"""
        try:
            # Garante que o diretório existe
            os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
            self.conn = sqlite3.connect(self.db_path)
            self.cursor = self.conn.cursor()
            logging.info("Conectado ao banco de dados com sucesso")
        except sqlite3.Error as e:
            logging.error(f"Erro ao conectar ao banco de dados: {e}")
            raise
    
    def criar_tabelas(self):
        """Cria as tabelas se não existirem"""
        try:
            # Tabela de produtos
            self.cursor.execute('''
                CREATE TABLE IF NOT EXISTS produtos (
                    id INTEGER PRIMARY KEY,
                    nome VARCHAR(255) NOT NULL,
                    valor_unitario REAL NOT NULL
                )
            ''')
            
            # Tabela de clientes
            self.cursor.execute('''
                CREATE TABLE IF NOT EXISTS clientes (
                    id INTEGER PRIMARY KEY,
                    nome VARCHAR(255) NOT NULL
                )
            ''')
            
            # Tabela de vendas
            self.cursor.execute('''
                CREATE TABLE IF NOT EXISTS vendas (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    produto_id INTEGER NOT NULL,
                    cliente_id INTEGER NOT NULL,
                    quantidade INTEGER NOT NULL,
                    data_venda DATE NOT NULL,
                    FOREIGN KEY (produto_id) REFERENCES produtos(id),
                    FOREIGN KEY (cliente_id) REFERENCES clientes(id)
                )
            ''')
            
            self.conn.commit()
            logging.info("Tabelas criadas/verificadas com sucesso")
            
        except sqlite3.Error as e:
            logging.error(f"Erro ao criar tabelas: {e}")
            raise
    
    def extrair_campos_linha(self, linha):
        """Extrai os campos de uma linha do arquivo .dat"""
        try:
            # Layout de campos (posição inicial, posição final, tipo)
            campos = [
                ('id_produto', 0, 4, 'int'),
                ('nome_produto', 4, 54, 'str'),
                ('id_cliente', 54, 58, 'int'),
                ('nome_cliente', 58, 108, 'str'),
                ('quantidade', 108, 111, 'int'),
                ('valor_unitario', 111, 121, 'float'),
                ('data_venda', 121, 131, 'date')
            ]
            
            dados = {}
            
            for campo, inicio, fim, tipo in campos:
                valor = linha[inicio:fim].strip()
                
                if tipo == 'int':
                    dados[campo] = int(valor) if valor else 0
                elif tipo == 'float':
                    # Converte para float, tratando o formato decimal
                    dados[campo] = float(valor) if valor else 0.0
                elif tipo == 'date':
                    dados[campo] = valor  # Mantém como string no formato YYYY-MM-DD
                else:  # string
                    dados[campo] = valor
            
            return dados
            
        except Exception as e:
            logging.error(f"Erro ao extrair campos da linha: {e}")
            logging.error(f"Linha problemática: {linha}")
            return None
    
    def produto_existe(self, produto_id):
        """Verifica se um produto já existe no banco"""
        try:
            self.cursor.execute("SELECT id FROM produtos WHERE id = ?", (produto_id,))
            return self.cursor.fetchone() is not None
        except sqlite3.Error as e:
            logging.error(f"Erro ao verificar produto {produto_id}: {e}")
            return False
    
    def cliente_existe(self, cliente_id):
        """Verifica se um cliente já existe no banco"""
        try:
            self.cursor.execute("SELECT id FROM clientes WHERE id = ?", (cliente_id,))
            return self.cursor.fetchone() is not None
        except sqlite3.Error as e:
            logging.error(f"Erro ao verificar cliente {cliente_id}: {e}")
            return False
    
    def inserir_produto(self, produto_id, nome, valor_unitario):
        """Insere um novo produto no banco"""
        try:
            self.cursor.execute(
                "INSERT INTO produtos (id, nome, valor_unitario) VALUES (?, ?, ?)",
                (produto_id, nome, valor_unitario)
            )
            self.conn.commit()
            logging.info(f"Produto inserido: {produto_id} - {nome}")
            return True
        except sqlite3.Error as e:
            logging.error(f"Erro ao inserir produto {produto_id}: {e}")
            return False
    
    def inserir_cliente(self, cliente_id, nome):
        """Insere um novo cliente no banco"""
        try:
            self.cursor.execute(
                "INSERT INTO clientes (id, nome) VALUES (?, ?)",
                (cliente_id, nome)
            )
            self.conn.commit()
            logging.info(f"Cliente inserido: {cliente_id} - {nome}")
            return True
        except sqlite3.Error as e:
            logging.error(f"Erro ao inserir cliente {cliente_id}: {e}")
            return False
    
    def inserir_venda(self, produto_id, cliente_id, quantidade, data_venda):
        """Insere uma nova venda no banco"""
        try:
            self.cursor.execute(
                "INSERT INTO vendas (produto_id, cliente_id, quantidade, data_venda) VALUES (?, ?, ?, ?)",
                (produto_id, cliente_id, quantidade, data_venda)
            )
            self.conn.commit()
            logging.info(f"Venda inserida: Produto {produto_id}, Cliente {cliente_id}, Qtd {quantidade}")
            return True
        except sqlite3.Error as e:
            logging.error(f"Erro ao inserir venda: {e}")
            return False
    
    def processar_arquivo(self, arquivo_path):
        """Processa o arquivo .dat completo"""
        try:
            if not os.path.exists(arquivo_path):
                logging.error(f"Arquivo não encontrado: {arquivo_path}")
                return False
            
            logging.info(f"Iniciando processamento do arquivo: {arquivo_path}")
            
            with open(arquivo_path, 'r', encoding='utf-8') as arquivo:
                linhas = arquivo.readlines()
            
            vendas_processadas = 0
            erros = 0
            
            for numero_linha, linha in enumerate(linhas, 1):
                linha = linha.strip()
                if not linha:  # Pula linhas vazias
                    continue
                
                logging.info(f"Processando linha {numero_linha}: {linha[:50]}...")
                
                # Extrai campos da linha
                dados = self.extrair_campos_linha(linha)
                if not dados:
                    erros += 1
                    continue
                
                # Processa produto
                if not self.produto_existe(dados['id_produto']):
                    self.inserir_produto(
                        dados['id_produto'], 
                        dados['nome_produto'], 
                        dados['valor_unitario']
                    )
                
                # Processa cliente
                if not self.cliente_existe(dados['id_cliente']):
                    self.inserir_cliente(
                        dados['id_cliente'], 
                        dados['nome_cliente']
                    )
                
                # Insere venda
                if self.inserir_venda(
                    dados['id_produto'],
                    dados['id_cliente'],
                    dados['quantidade'],
                    dados['data_venda']
                ):
                    vendas_processadas += 1
                else:
                    erros += 1
            
            logging.info(f"Processamento concluído: {vendas_processadas} vendas processadas, {erros} erros")
            return vendas_processadas > 0
            
        except Exception as e:
            logging.error(f"Erro geral ao processar arquivo: {e}")
            return False
    
    def fechar_conexao(self):
        """Fecha a conexão com o banco de dados"""
        if hasattr(self, 'conn'):
            self.conn.close()
            logging.info("Conexão com banco de dados fechada")

def main():
    """Função principal"""
    import sys
    
    if len(sys.argv) != 2:
        print("Uso: python processador_vendas.py <caminho_do_arquivo.dat>")
        print("Exemplo: python processador_vendas.py ../BancoDeDados/vendas_dia_2025-09-29.dat")
        sys.exit(1)
    
    arquivo_path = sys.argv[1]
    
    processador = None
    try:
        processador = ProcessadorVendas()
        sucesso = processador.processar_arquivo(arquivo_path)
        
        if sucesso:
            print("Processamento concluído com sucesso!")
        else:
            print("Ocorreram erros durante o processamento. Verifique o log.")
            sys.exit(1)
            
    except Exception as e:
        logging.error(f"Erro fatal: {e}")
        print(f"Erro fatal: {e}")
        sys.exit(1)
    finally:
        if processador:
            processador.fechar_conexao()

if __name__ == "__main__":
    main()