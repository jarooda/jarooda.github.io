let copyButtonLabel: string = "Copy Code";
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
  copyButton.innerHTML = copyButtonLabel;

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
    button.innerText = "Code Copied";

    setTimeout(() => {
      button.innerText = copyButtonLabel;
    }, 700);
  } catch (error) {
    console.error("Failed to copy code:", error);
  }
}
