async function handleResponse() {
    const response = await fetch('https://prod-29.westeurope.logic.azure.com/workflows/6bfd40aaf5644dd98c008672622da864/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=Z4MwyLvwXviNBzlLlE-6D2Ez7VkyshAu-dF5UdiTWqw');
    const data = await response.json();
    // Handle the response data here
    const tableBody = document.querySelector('#responseTable tbody');
    for (const row of data) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${row.Column1}</td><td>${row.Name}</td><td>${row.Column3}</td>`;
        tableBody.appendChild(tr);
    }
    // Update notification
    const notification = document.querySelector('#notification');
    notification.innerHTML = 'Data fetched successfully!';
    // Write flag to file
    fetch('/writeFlag', { method: 'POST' });
}

handleResponse();
