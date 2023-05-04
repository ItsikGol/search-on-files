const searchForm = document.querySelector("#search-form");
const searchResultsList = document.querySelector("#search-results");

// Create a spinner element
const spinner = document.createElement("div");
spinner.classList.add("spinner");
spinner.innerHTML = '<i class="spinner fas fa-circle-notch fa-spin"></i>';

searchForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Add the spinner to the search results list
  searchResultsList.innerHTML = "";
  searchResultsList.appendChild(spinner);

  try {
    const searchQuery = searchForm.q.value;
    const response = await fetch(`/api/find-text?text=${searchQuery}`);
    const data = await response.json();

    // Remove the spinner
    searchResultsList.innerHTML = "";

    if (data.length === 0) {
      const noResultMsg = document.createElement("p");
      noResultMsg.textContent = "No results found.";
      searchResultsList.appendChild(noResultMsg);
      return;
    }

    data.forEach((result) => {
      const resultItemCard = document.createElement("div");
      resultItemCard.classList.add("search-result-card");

      const headerResult = document.createElement("div");
      headerResult.classList.add("search-result-card__header");

      const allTextResult = document.createElement("div");
      allTextResult.classList.add("search-result-card__allText");
      allTextResult.style.display = "none"; // hide allTextResult by default

      const numberPagesResult = document.createElement("div");
      numberPagesResult.classList.add("search-result-card__numberPages");

      const createDocResult = document.createElement("div");
      createDocResult.classList.add("search-result-card__createDoc");

      //set data to each item
      const toggleBtn = document.createElement("button");
      toggleBtn.classList.add("search-result-card__toggle");
      toggleBtn.innerHTML = '<i class="fas fa-chevron-down"></i>';

      headerResult.innerHTML = `${result.highlight.textDoc}`;
      allTextResult.innerHTML = result._source.textDoc;
      numberPagesResult.textContent = `${result._source.id} שם מסמך`;
      createDocResult.textContent = `document created on: ${result._source.createDoc}`;
      createDocResult.setAttribute("href", result._source.createDoc);

      resultItemCard.appendChild(headerResult);
      resultItemCard.appendChild(toggleBtn);
      resultItemCard.appendChild(allTextResult);
      resultItemCard.appendChild(numberPagesResult);
      resultItemCard.appendChild(createDocResult);
      searchResultsList.appendChild(resultItemCard);

      toggleBtn.addEventListener("click", () => {
        if (allTextResult.style.display === "none") {
          allTextResult.style.display = "block";
          toggleBtn.innerHTML = '<i class="fas fa-chevron-up"></i>';
        } else {
          allTextResult.style.display = "none";
          toggleBtn.innerHTML = '<i class="fas fa-chevron-down"></i>';
        }
      });
    });
  } catch (error) {
    console.log(error);
    alert("error!");
  }
});
