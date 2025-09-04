
        // Elementos do DOM
        const formConvidado = document.getElementById('form-convidado');
        const btnLimpar = document.getElementById('btn-limpar');
        const btnExportar = document.getElementById('btn-exportar');
        const btnImportar = document.getElementById('btn-importar');
        const importFile = document.getElementById('import-file');
        const temCriancasCheckbox = document.getElementById('tem_criancas');
        const criancasGroup = document.getElementById('criancas-group');
        const categoryButtons = document.querySelectorAll('.category-filter button');
        
        // Categorias
        const categorias = {
            'familia_noivo': 'Família do Noivo',
            'familia_noiva': 'Família da Noiva',
            'padrinhos': 'Padrinhos',
            'amigos': 'Amigos'
        };
        
        // Classes para badges
        const badgeClasses = {
            'familia_noivo': 'badge-noivo',
            'familia_noiva': 'badge-noiva',
            'padrinhos': 'badge-padrinhos',
            'amigos': 'badge-amigos'
        };
        
        // Filtro atual
        let currentFilter = 'all';
        
        // Inicializar dados
        let convidados = JSON.parse(localStorage.getItem('convidados')) || [];
        
        // Atualizar estatísticas e lista
        function atualizarDados() {
            atualizarEstatisticas();
            renderizarLista();
        }
        
        // Atualizar estatísticas
        function atualizarEstatisticas() {
            let totalAdultos = 0;
            let totalCriancas = 0;
            
            convidados.forEach(convidado => {
                totalAdultos += 1; // O convidado principal
                if (convidado.acompanhante) totalAdultos += 1; // Acompanhante
                if (convidado.criancas) totalCriancas += parseInt(convidado.criancas);
            });
            
            document.getElementById('total-pessoas').textContent = totalAdultos + totalCriancas;
            document.getElementById('total-adultos').textContent = totalAdultos;
            document.getElementById('total-criancas').textContent = totalCriancas;
            document.getElementById('total-familias').textContent = convidados.length;
        }
        
        // Renderizar lista de convidados
        function renderizarLista() {
            const listaElement = document.getElementById('lista-convidados');
            
            // Filtrar convidados
            const convidadosFiltrados = currentFilter === 'all' 
                ? convidados 
                : convidados.filter(c => c.categoria === currentFilter);
            
            if (convidadosFiltrados.length === 0) {
                const message = currentFilter === 'all' 
                    ? 'Nenhum convidado cadastrado ainda.' 
                    : `Nenhum convidado na categoria "${categorias[currentFilter]}".`;
                listaElement.innerHTML = `<div class="no-data">${message}</div>`;
                return;
            }
            
            let html = `
                <table>
                    <tr>
                        <th>Categoria</th>
                        <th>Convidado</th>
                        <th>Acompanhante</th>
                        <th>Crianças</th>
                        <th>Ações</th>
                    </tr>
            `;
            
            convidadosFiltrados.forEach((convidado, index) => {
                // Encontrar índice real no array completo
                const realIndex = convidados.findIndex(c => 
                    c.nome === convidado.nome && 
                    c.categoria === convidado.categoria
                );
                
                html += `
                    <tr>
                        <td><span class="category-badge ${badgeClasses[convidado.categoria]}">${categorias[convidado.categoria]}</span></td>
                        <td>${convidado.nome}</td>
                        <td>${convidado.acompanhante || '-'}</td>
                        <td>${convidado.criancas || '-'}</td>
                        <td>
                            <button type="button" class="btn-danger btn-remover" data-index="${realIndex}">Remover</button>
                        </td>
                    </tr>
                `;
            });
            
            html += '</table>';
            listaElement.innerHTML = html;
            
            // Adicionar event listeners aos botões de remover
            document.querySelectorAll('.btn-remover').forEach(btn => {
                btn.addEventListener('click', function() {
                    const index = parseInt(this.getAttribute('data-index'));
                    removerConvidado(index);
                });
            });
        }
        
        // Adicionar convidado
        function adicionarConvidado(categoria, nome, acompanhante, criancas) {
            convidados.push({
                categoria,
                nome,
                acompanhante: acompanhante || null,
                criancas: criancas || null
            });
            
            localStorage.setItem('convidados', JSON.stringify(convidados));
            atualizarDados();
        }
        
        // Remover convidado
        function removerConvidado(index) {
            if (confirm('Tem certeza que deseja remover este convidado?')) {
                convidados.splice(index, 1);
                localStorage.setItem('convidados', JSON.stringify(convidados));
                atualizarDados();
            }
        }
        
        // Limpar lista
        function limparLista() {
            if (confirm('Tem certeza que deseja limpar toda a lista? Esta ação não pode ser desfeita.')) {
                convidados = [];
                localStorage.removeItem('convidados');
                atualizarDados();
            }
        }
        
        // Exportar para CSV
        function exportarParaCSV() {
            if (convidados.length === 0) {
                alert('Não há dados para exportar.');
                return;
            }
            
            let csv = 'Categoria,Convidado,Acompanhante,Crianças\n';
            
            convidados.forEach(convidado => {
                csv += `"${categorias[convidado.categoria]}","${convidado.nome}","${convidado.acompanhante || ''}","${convidado.criancas || ''}"\n`;
            });
            
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            
            link.setAttribute('href', url);
            link.setAttribute('download', 'lista_convidados_casamento.csv');
            link.style.visibility = 'hidden';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
        
        // Importar de CSV
        function importarDeCSV(file) {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                const content = e.target.result;
                const lines = content.split('\n');
                const novosConvidados = [];
                
                // Pular o cabeçalho e processar cada linha
                for (let i = 1; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (!line) continue;
                    
                    // Processar CSV considerando aspas
                    const values = [];
                    let current = '';
                    let insideQuotes = false;
                    
                    for (let char of line) {
                        if (char === '"') {
                            insideQuotes = !insideQuotes;
                        } else if (char === ',' && !insideQuotes) {
                            values.push(current.trim());
                            current = '';
                        } else {
                            current += char;
                        }
                    }
                    values.push(current.trim());
                    
                    if (values.length >= 2 && values[1]) {
                        // Encontrar a chave da categoria pelo valor
                        let categoriaKey = '';
                        for (const [key, value] of Object.entries(categorias)) {
                            if (value === values[0].replace(/^"|"$/g, '')) {
                                categoriaKey = key;
                                break;
                            }
                        }
                        
                        if (!categoriaKey) {
                            // Se não encontrou, usar a primeira categoria como padrão
                            categoriaKey = 'familia_noivo';
                        }
                        
                        novosConvidados.push({
                            categoria: categoriaKey,
                            nome: values[1].replace(/^"|"$/g, ''),
                            acompanhante: values[2] ? values[2].replace(/^"|"$/g, '') : null,
                            criancas: values[3] ? values[3].replace(/^"|"$/g, '') : null
                        });
                    }
                }
                
                if (novosConvidados.length > 0) {
                    if (confirm(`Encontrados ${novosConvidados.length} convidados no arquivo. Deseja importar?`)) {
                        convidados = convidados.concat(novosConvidados);
                        localStorage.setItem('convidados', JSON.stringify(convidados));
                        atualizarDados();
                        alert('Dados importados com sucesso!');
                    }
                } else {
                    alert('Nenhum convidado válido encontrado no arquivo.');
                }
            };
            
            reader.readAsText(file);
        }
        
        // Event Listeners
        formConvidado.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const categoria = document.getElementById('categoria').value;
            const nome = document.getElementById('nome').value.trim();
            const acompanhante = document.getElementById('acompanhante').value.trim();
            const temCriancas = document.getElementById('tem_criancas').checked;
            const quantidadeCriancas = temCriancas ? parseInt(document.getElementById('quantidade_criancas').value) : null;
            
            if (!categoria) {
                alert('Por favor, selecione uma categoria.');
                return;
            }
            
            if (!nome) {
                alert('Por favor, informe o nome do convidado.');
                return;
            }
            
            if (quantidadeCriancas !== null && (isNaN(quantidadeCriancas) || quantidadeCriancas < 1)) {
                alert('Por favor, informe uma quantidade válida de crianças.');
                return;
            }
            
            adicionarConvidado(categoria, nome, acompanhante || null, quantidadeCriancas);
            
            // Limpar formulário, mantendo a categoria
            document.getElementById('nome').value = '';
            document.getElementById('acompanhante').value = '';
            document.getElementById('tem_criancas').checked = false;
            criancasGroup.style.display = 'none';
            document.getElementById('quantidade_criancas').value = '1';
        });
        
        temCriancasCheckbox.addEventListener('change', function() {
            criancasGroup.style.display = this.checked ? 'block' : 'none';
        });
        
        btnLimpar.addEventListener('click', limparLista);
        
        btnExportar.addEventListener('click', exportarParaCSV);
        
        btnImportar.addEventListener('click', function() {
            importFile.click();
        });
        
        importFile.addEventListener('change', function() { 
            if (this.files.length > 0) {
                importarDeCSV(this.files[0]);
                this.value = ''; // Resetar o input
            }
        });
        
        // Filtros de categoria
        categoryButtons.forEach(button => {
            button.addEventListener('click', function() {
                const category = this.getAttribute('data-category');
                
                // Atualizar botões ativos
                categoryButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                
                // Aplicar filtro
                currentFilter = category;
                renderizarLista();
            });
        });
        
        // Inicializar
        atualizarDados();