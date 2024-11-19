import { useState, useEffect } from "react";
import axios from "axios";
import Style from "./Home.module.css";
import Modal from "react-modal";

// ICONS
import { FaRegTrashAlt } from "react-icons/fa";
import { CiEdit } from "react-icons/ci";

Modal.setAppElement("#root");

const Home = () => {
  const [allDados, setAllDados] = useState([]);
  const [draggedIndex, setDraggedIndex] = useState(null);

  // Função para buscar tarefas
  const fetchTarefas = async () => {
    try {
      const response = await axios.get("https://fattotest.vercel.app/getDados");
      const dadosOrdenados = response.data.sort((a, b) => a.ordem - b.ordem); // Ordena os dados pela ordem
      setAllDados(dadosOrdenados);
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    }
  };
  

  useEffect(() => {
    fetchTarefas();
  }, []);

  // Função para lidar com drag-and-drop
  const handleDrop = async (index) => {
    if (draggedIndex === null) return;

    const updatedDados = [...allDados];
    const [movedItem] = updatedDados.splice(draggedIndex, 1);
    updatedDados.splice(index, 0, movedItem);

    // Atualiza a ordem localmente
    const novaOrdem = updatedDados.map((item, idx) => ({
      ...item,
      ordem: idx + 1,
    }));

    setAllDados(novaOrdem);

    // Atualiza no back-end
    try {
      await axios.put("https://fattotest.vercel.app/atualizarOrdem", {
        novaOrdem: novaOrdem.map((item) => ({ id: item.id, ordem: item.ordem })),
      });
    } catch (error) {
      console.error("Erro ao atualizar ordem no back-end:", error);
    }

    setDraggedIndex(null);
  };

  const handleDragStart = (index) => {
    setDraggedIndex(index);
  };

  // Modal e inclusão de tarefas
  const [nomeTarefa, setNomeTarefa] = useState("");
  const [custo, setCusto] = useState("");
  const [dataLimite, setDataLimite] = useState("");

  // Edite de tarefas
  const [nomeTarefaEdit, setNomeTarefaEdit] = useState("");
  const [custoEdit, setCustoEdit] = useState("");
  const [dataLimiteEdit, setDataLimiteEdit] = useState("");

  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [modalIsOpen2, setModalIsOpen2] = useState(false);
  const [modalIsOpen3, setModalIsOpen3] = useState(false);
  
  const [id, setId] = useState("");

  const handleSubmitForms = async (e) => {
    e.preventDefault();
  
    // Verificar se o nome da tarefa está vazio ou contém apenas espaços
    if (!nomeTarefa.trim()) {
      alert("O nome da tarefa não pode ser vazio!");
      setCusto("");
      setNomeTarefa("");
      setDataLimite("");
      return;
    }
  
    // Verificar se o custo é um número válido e maior que zero
    if (!custo.trim() || isNaN(custo) || parseFloat(custo) <= 0) {
      alert("O custo deve ser um número válido e maior que zero!");
      setCusto("");
      setNomeTarefa("");
      setDataLimite("");
      return;
    }
  
    // Verificar se a data é válida
    if (!dataLimite || isNaN(Date.parse(dataLimite))) {
      alert("A data limite deve ser válida!");
      return;
    }
  
    const tarefa = {
      nomeTarefa,
      custo,
      dataLimite,
    };
  
    try {
      const response = await axios.post("https://fattotest.vercel.app/addTarefa", tarefa);
      if (response.status === 201) {
        closeModal2();
        fetchTarefas();
        setNomeTarefa("");
        setCusto("");
        setDataLimite("");
      }
    } catch (error) {
      if (error.response && error.response.status === 400) {
        alert("Essa tarefa já está em curso!");
        setNomeTarefa("");
        setCusto("");
        setDataLimite("");
      }
    }
  };
  
  

  const deletarUser = async () => {
    try {
      const response = await axios.delete(`https://fattotest.vercel.app/deletarTarefa/${id}`);
      if (response.status === 200) {
        closeModal();
        fetchTarefas();
      }
    } catch (error) {
      console.error("Erro ao deletar tarefa:", error);
    }
  };

  const closeModal = () => setModalIsOpen(false);
  const closeModal2 = () => setModalIsOpen2(false);
  const closeModal3 = () => setModalIsOpen3(false);

  const handleSubmitFormEdit = async (e) => {
    e.preventDefault();
  
    const tarefaEdit = {
      id, // Envia o ID da tarefa para o back-end
      nomeTarefa: nomeTarefaEdit, // Nome atualizado
      custo: custoEdit, // Custo atualizado
      dataLimite: dataLimiteEdit, // Data limite atualizada
    };
  
    try {
      const response = await axios.put("https://fattotest.vercel.app/editTarefa", tarefaEdit);
      if (response.status === 200) {
        closeModal3(); // Fecha o modal de edição
        fetchTarefas(); // Atualiza a lista de tarefas
      }
    } catch (error) {
      console.error("Erro ao editar tarefa:", error);
    }
  };
  
  const formatDate = (dateStr) => {
    const [day, month, year] = dateStr.split("/");  // Divide a data
    return `${year}-${month}-${day}`;  // Retorna no formato "yyyy-MM-dd"
  };
  
  // Ao preencher o modal de edição, formate a data
  useEffect(() => {
    if (allDados && allDados.data_limite) {
      setDataLimiteEdit(formatDate(allDados.data_limite));  // Formata a data antes de definir
    }
  }, [allDados]);
  

  return (
    <div className={Style.divPrincHome}>
      <h1>Tarefas</h1>
      {allDados.length === 0 ? (
  <p>Carregando...</p>
) : (
  <table className={Style.table}>
    <thead>
      <tr>
        <th>ID</th>
        <th>Nome</th>
        <th>Custo</th>
        <th>Data Limite</th>
        <th>Editar</th>
        <th>Excluir</th>
      </tr>
    </thead>

    <tbody>
      {allDados.map((dados, index) => (
        <tr
          key={dados.id}
          draggable
          onDragStart={() => handleDragStart(index)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => handleDrop(index)}
          style={{
            backgroundColor: dados.custo >= 1000 ? "yellow" : "transparent",
            cursor: "grab",
          }}
        >
          <td>{dados.ordem}</td>
          <td>{dados.nome}</td>
          <td>{dados.custo}</td>
          <td>{dados.data_limite}</td>

          <td>
            <CiEdit
              className={Style.iconsTable}
              onClick={() => {
                setId(dados.id); // Armazena o ID da tarefa
                setNomeTarefaEdit(dados.nome); // Preenche o nome da tarefa no modal
                setCustoEdit(dados.custo); // Preenche o custo da tarefa no modal
                setDataLimiteEdit(dados.data_limite); // Preenche a data limite no modal
                console.log(dados.data_limite)
                setModalIsOpen3(true); // Abre o modal de edição
              }}
            />
          </td>

          <td>
            <FaRegTrashAlt
              className={Style.iconsTable}
              onClick={() => {
                setId(dados.id);
                setModalIsOpen(true);
              }}
            />
          </td>
        </tr>
      ))}
    </tbody>
  </table>
)}


      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        className={Style.modalEcluir}
        overlayClassName={Style.overlay}
      >
        <h3>Realmente deseja excluir a tarefa?</h3>
        <div className={Style.divButtons}>
          <button onClick={deletarUser}>Sim</button>
          <button onClick={closeModal}>Não</button>
        </div>
      </Modal>

      <Modal
        isOpen={modalIsOpen3}
        onRequestClose={closeModal3}
        className={Style.modal}
        overlayClassName={Style.overlay}
      >
        <h2>Edite sua tarefa</h2>
        <form onSubmit={handleSubmitFormEdit}>
          <label>
            <span>Nome da tarefa</span>
            <input
              type="text"
              value={nomeTarefaEdit}
              onChange={(e) => setNomeTarefaEdit(e.target.value)}
              required
            />
          </label>

          <label>
            <span>Custo</span>
            <input
              type="number"
              value={custoEdit}
              onChange={(e) => setCustoEdit(e.target.value)}
              required
            />
          </label>

          <label>
            <span>Data Limite</span>
            <input
              type="date"
              name="dataLimite"
              value={dataLimiteEdit}
              onChange={(e) => setDataLimiteEdit(e.target.value)}
              required
            />
          </label>

          <button>Editar</button>
        </form>
        
      </Modal>

      <button className={Style.buttonIncluir} onClick={() => setModalIsOpen2(true)}>
        Incluir
      </button>

      <Modal
        isOpen={modalIsOpen2}
        onRequestClose={closeModal2}
        className={Style.modal}
        overlayClassName={Style.overlay}
      >
        <h2>Adicione uma tarefa</h2>
        <form onSubmit={handleSubmitForms}>
          <label>
            <span>Nome da tarefa</span>
            <input
              type="text"
              value={nomeTarefa}
              onChange={(e) => setNomeTarefa(e.target.value)}
              required
            />
          </label>

          <label>
            <span>Custo</span>
            <input
              type="number"
              value={custo}
              onChange={(e) => setCusto(e.target.value)}
              required
            />
          </label>

          <label>
            <span>Data Limite</span>
            <input
              type="date"
              name="dataLimite"
              value={dataLimite}
              onChange={(e) => setDataLimite(e.target.value)}
              required
            />
          </label>

          <button>Adicionar</button>
        </form>
      </Modal>
    </div>
  );
};

export default Home;
