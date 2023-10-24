const copyImg: string = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M9 18q-.825 0-1.413-.588T7 16V4q0-.825.588-1.413T9 2h9q.825 0 1.413.588T20 4v12q0 .825-.588 1.413T18 18H9Zm0-2h9V4H9v12Zm-4 6q-.825 0-1.413-.588T3 20V7q0-.425.288-.713T4 6q.425 0 .713.288T5 7v13h10q.425 0 .713.288T16 21q0 .425-.288.713T15 22H5Zm4-6V4v12Z"/></svg>`
const checkMarkImg: string = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="m10.6 16.2l7.05-7.05l-1.4-1.4l-5.65 5.65l-2.85-2.85l-1.4 1.4l4.25 4.25ZM5 21q-.825 0-1.413-.588T3 19V5q0-.825.588-1.413T5 3h14q.825 0 1.413.588T21 5v14q0 .825-.588 1.413T19 21H5Z"/></svg>`
const preBlocks: HTMLPreElement[] = Array.from(document.querySelectorAll("pre"));

for (const preBlock of preBlocks) {
  // add relative style to preBlock
  preBlock.style.position = "relative";

  renderCodeLang(preBlock);
  renderCopyBtn(preBlock);
}

// FUNCTIONS
function renderCodeLang(preBlock: HTMLPreElement): void {
  const classLang: string = preBlock.className;
  const lang: string = classLang.split('-')[1];

  if (lang !== 'plaintext') {
    // add lang section on top left
    const langSection: HTMLDivElement = document.createElement("div");
    langSection.className = "code-lang";
    langSection.innerHTML = lang;
  
    preBlock.prepend(langSection);
  }

}

function renderCopyBtn(preBlock: HTMLPreElement): void {
  const copyButton: HTMLButtonElement = document.createElement("button");

  copyButton.className = "copy-code";
  copyButton.setAttribute("aria-label", "Copy code to clipboard");
  copyButton.setAttribute("title", "Copy code to clipboard");
  copyButton.innerHTML = copyImg;

  preBlock.setAttribute("tabindex", "0");
  preBlock.appendChild(copyButton);

  copyButton.addEventListener("click", async () => {
    await copyCode(preBlock, copyButton);
  });
}

async function copyCode(block: HTMLPreElement, button: HTMLButtonElement): Promise<void> {
  const code: HTMLElement | null = block.querySelector("code");
  const text: string = code?.innerText || "";

  try {
    await navigator.clipboard.writeText(text);

    // Visual feedback that the task is completed
    button.innerHTML = checkMarkImg;

    setTimeout(() => {
      button.innerHTML = copyImg;
    }, 700);
  } catch (error) {
    console.error("Failed to copy code:", error);
  }
}
