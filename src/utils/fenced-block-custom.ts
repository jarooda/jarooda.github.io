const copyImg: string = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M9 18q-.825 0-1.413-.588T7 16V4q0-.825.588-1.413T9 2h9q.825 0 1.413.588T20 4v12q0 .825-.588 1.413T18 18H9Zm0-2h9V4H9v12Zm-4 6q-.825 0-1.413-.588T3 20V7q0-.425.288-.713T4 6q.425 0 .713.288T5 7v13h10q.425 0 .713.288T16 21q0 .425-.288.713T15 22H5Zm4-6V4v12Z"/></svg>`
const checkMarkImg: string = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="m10.6 16.2l7.05-7.05l-1.4-1.4l-5.65 5.65l-2.85-2.85l-1.4 1.4l4.25 4.25ZM5 21q-.825 0-1.413-.588T3 19V5q0-.825.588-1.413T5 3h14q.825 0 1.413.588T21 5v14q0 .825-.588 1.413T19 21H5Z"/></svg>`
let codeBlocks: HTMLPreElement[] = Array.from(document.querySelectorAll("pre"));

function renderCodeLang(codeBlock: HTMLPreElement): void {
  const classLang: string = codeBlock.className;
  const lang: string = classLang.split('-')[1];
  
  // add lang section on top left
  let langSection: HTMLDivElement = document.createElement("div");
  langSection.className = "code-lang";
  langSection.innerHTML = lang;

  codeBlock.prepend(langSection);
}

function renderCopyBtn(wrapper: HTMLDivElement, codeBlock: HTMLPreElement): void {
  let copyButton: HTMLButtonElement = document.createElement("button");
  copyButton.className = "copy-code";
  copyButton.setAttribute("aria-label", "Copy code to clipboard");
  copyButton.setAttribute("title", "Copy code to clipboard");
  copyButton.innerHTML = copyImg;

  codeBlock.setAttribute("tabindex", "0");
  codeBlock.appendChild(copyButton);

  // Wrap code block with a relative parent element
  codeBlock.parentNode?.insertBefore(wrapper, codeBlock);
  wrapper.appendChild(codeBlock);

  copyButton.addEventListener("click", async () => {
    await copyCode(codeBlock, copyButton);
  });
}

for (let codeBlock of codeBlocks) {
  let wrapper: HTMLDivElement = document.createElement("div");
  wrapper.style.position = "relative";

  renderCopyBtn(wrapper, codeBlock);
  renderCodeLang(codeBlock);
}

async function copyCode(block: HTMLPreElement, button: HTMLButtonElement): Promise<void> {
  let code: HTMLElement | null = block.querySelector("code");
  let text: string = code?.innerText || "";

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
