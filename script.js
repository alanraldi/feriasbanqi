document.addEventListener("DOMContentLoaded", async function () {
  // Verifica se o usuário está autenticado, com e-mail verificado e do domínio permitido
  firebase.auth().onAuthStateChanged(user => {
    if (!user) {
      window.location.href = "login.html";
    } else {
      if (!user.emailVerified) {
        alert("Por favor, verifique seu e-mail antes de acessar a página.");
        firebase.auth().signOut();
        window.location.href = "login.html";
      }
      if (!user.email.endsWith("@casasbahia.com.br")) {
        alert("Apenas usuários do domínio casasbahia.com.br podem acessar.");
        firebase.auth().signOut();
        window.location.href = "login.html";
      }
    }
  });

  // Logout
  const logoutButton = document.getElementById("logout-button");
  if (logoutButton) {
    logoutButton.addEventListener("click", function() {
      firebase.auth().signOut().then(() => {
        window.location.href = "login.html";
      });
    });
  }

  // (Configuração do Firebase já foi realizada em firebase-config.js)
  const db = firebase.firestore();

  const form = document.getElementById('cadastro-form');
  const mesAno = document.getElementById('mes-ano');
  mesAno.style.textTransform = 'uppercase';
  const diasCalendario = document.getElementById('dias-calendario');
  const feriasLista = document.getElementById('ferias-lista');
  let currentMonth = new Date().getMonth();
  let currentYear = new Date().getFullYear();

  const modal = document.getElementById("edit-modal");
  const closeModal = document.querySelector(".close");

  const editForm = document.getElementById("edit-form");
  const deleteButton = document.getElementById("delete-button");
  let editId = null;

  function generateColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  async function saveToFirestore(data) {
    if (editId) {
      await db.collection('ferias').doc(editId).update(data);
      editId = null;
    } else {
      await db.collection('ferias').add(data);
    }
  }

  async function getFirestoreData() {
    const snapshot = await db.collection('ferias').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    const nome = document.getElementById('nome').value;
    const squad = document.getElementById('squad').value;
    const tipo = document.getElementById('tipo').value;
    const dataInicio = document.getElementById('data-inicio').value;
    const dataFim = document.getElementById('data-fim').value;

    const feriasData = {
      nome,
      squad,
      tipo,
      dataInicio,
      dataFim,
      cor: generateColor()
    };

    await saveToFirestore(feriasData);
    generateCalendar(currentMonth, currentYear);
  });

  async function generateCalendar(month, year) {
    diasCalendario.innerHTML = '';
    feriasLista.innerHTML = '';
    const firstDay = new Date(year, month).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    const todayDay = today.getDate();
    const todayMonth = today.getMonth();
    const todayYear = today.getFullYear();

    mesAno.textContent = `${new Date(year, month).toLocaleString('default', { month: 'long' })} ${year}`;

    let date = 1;
    const storedData = await getFirestoreData();
    const professionalsOnLeave = [];

    for (let i = 0; i < 6; i++) {
      const row = document.createElement('tr');
      for (let j = 0; j < 7; j++) {
        if (i === 0 && j < firstDay) {
          const cell = document.createElement('td');
          cell.textContent = '';
          row.appendChild(cell);
        } else if (date > daysInMonth) {
          break;
        } else {
          const cell = document.createElement('td');
          const cellText = document.createTextNode(date);

          if (date === todayDay && month === todayMonth && year === todayYear) {
            cell.classList.add('highlight-today');
          }

          cell.appendChild(cellText);

          const cellDate = new Date(year, month, date);
          storedData.forEach((entry) => {
            const dataInicioEntry = new Date(entry.dataInicio);
            const dataFimEntry = new Date(entry.dataFim);

            if (cellDate >= dataInicioEntry && cellDate <= dataFimEntry.setDate(dataFimEntry.getDate() + 1)) {
              const span = document.createElement('span');
              let displayName = entry.nome;
              if (entry.tipo === "Day Off") {
                displayName += " *";
              }
              if (dataFimEntry < today) {
                span.style.textDecoration = "line-through";
              }
              const tooltip = document.createElement('div');
              tooltip.className = 'tooltip';
              tooltip.textContent = displayName;

              const tooltipText = document.createElement('div');
              tooltipText.className = 'tooltiptext';
              tooltipText.innerHTML = `
                <strong>Nome:</strong> ${entry.nome}<br>
                <strong>Squad:</strong> ${entry.squad}<br>
                <strong>Tipo:</strong> ${entry.tipo}<br>
                <strong>Data de Início:</strong> ${entry.dataInicio}<br>
                <strong>Data de Término:</strong> ${entry.dataFim}
              `;
              tooltip.appendChild(tooltipText);
              span.appendChild(tooltip);
              span.style.backgroundColor = entry.cor;
              span.style.padding = '2px 4px';
              span.style.color = '#FFF';
              span.style.borderRadius = '4px';
              span.style.marginTop = '1px';
              span.style.fontSize = '8px';
              span.style.display = 'block';
              span.style.whiteSpace = 'normal';
              span.style.overflowWrap = 'break-word';
              span.style.maxHeight = '100%';
              span.className = 'profissional-color';
              span.setAttribute("data-id", entry.id);
              span.addEventListener('click', () => openEditModal(entry.id));
              cell.appendChild(span);

              if (!professionalsOnLeave.includes(entry)) {
                professionalsOnLeave.push(entry);
              }
            }
          });

          row.appendChild(cell);
          date++;
        }
      }
      diasCalendario.appendChild(row);
    }

    professionalsOnLeave.forEach(profissional => {
      const listItem = document.createElement('li');
      const tooltip = document.createElement('div');
      tooltip.className = 'tooltip';
      tooltip.textContent = profissional.nome;

      const tooltipText = document.createElement('div');
      tooltipText.className = 'tooltiptext';
      tooltipText.innerHTML = `
        <strong>Nome:</strong> ${profissional.nome}<br>
        <strong>Squad:</strong> ${profissional.squad}<br>
        <strong>Tipo:</strong> ${profissional.tipo}<br>
        <strong>Data de Início:</strong> ${profissional.dataInicio}<br>
        <strong>Data de Término:</strong> ${profissional.dataFim}
      `;
      tooltip.appendChild(tooltipText);
      listItem.appendChild(tooltip);
      feriasLista.appendChild(listItem);
    });
  }

  async function openEditModal(id) {
    const doc = await db.collection('ferias').doc(id).get();
    if (doc.exists) {
      const entry = doc.data();
      document.getElementById('edit-nome').value = entry.nome;
      document.getElementById('edit-squad').value = entry.squad;
      document.getElementById('edit-tipo').value = entry.tipo;
      document.getElementById('edit-data-inicio').value = entry.dataInicio;
      document.getElementById('edit-data-fim').value = entry.dataFim;

      editId = id;
      modal.style.display = "block";
    } else {
      console.error("Documento não encontrado para edição: ", id);
    }
  }

  closeModal.addEventListener('click', () => {
    modal.style.display = "none";
    editId = null;
  });

  editForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    const nome = document.getElementById('edit-nome').value;
    const squad = document.getElementById('edit-squad').value;
    const tipo = document.getElementById('edit-tipo').value;
    const dataInicio = document.getElementById('edit-data-inicio').value;
    const dataFim = document.getElementById('edit-data-fim').value;

    const updatedData = {
      nome,
      squad,
      tipo,
      dataInicio,
      dataFim,
      cor: generateColor()
    };

    await saveToFirestore(updatedData);
    modal.style.display = "none";
    generateCalendar(currentMonth, currentYear);
  });

  deleteButton.addEventListener('click', async function () {
    if (editId) {
      const docRef = db.collection('ferias').doc(editId);
      const docSnapshot = await docRef.get();
      if (docSnapshot.exists) {
        await docRef.delete();
        console.log("Documento excluído: ", editId);
      } else {
        console.error("Documento não encontrado para exclusão: ", editId);
      }
      modal.style.display = "none";
      generateCalendar(currentMonth, currentYear);
    }
  });

  document.getElementById('mes-anterior').addEventListener('click', function () {
    currentMonth--;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }
    generateCalendar(currentMonth, currentYear);
  });

  document.getElementById('mes-posterior').addEventListener('click', function () {
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
    generateCalendar(currentMonth, currentYear);
  });

  function exportToCSV(data) {
    const csvContent = "data:text/csv;charset=utf-8," +
      ["Nome,Squad,Tipo,Data Início,Data Fim"]
        .concat(data.map(entry => `${entry.nome},${entry.squad},${entry.tipo},${entry.dataInicio},${entry.dataFim}`))
        .join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "ferias.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  document.getElementById('export-csv').addEventListener('click', async function () {
    const storedData = await getFirestoreData();
    exportToCSV(storedData);
  });

  generateCalendar(currentMonth, currentYear);
});
