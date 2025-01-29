import * as vscode from 'vscode';
import * as ollama from 'ollama';

export function activate(context: vscode.ExtensionContext) {
  console.log('mg-deepseek-vscode-extension is active!');

  const disposable = vscode.commands.registerCommand('mg-deepseek-vscode-extension.start', () => {
    const panel = vscode.window.createWebviewPanel('deepChat', 'DeepSeek Chat', vscode.ViewColumn.One, { enableScripts: true });

    panel.webview.html = getWebviewContent();

    panel.webview.onDidReceiveMessage(async (message: any) => {
      if (message.command === 'chat') {
        const userPrompt = message.text;
        let responseText = '';

        try {
          const streamResponse = await ollama.default.chat({
            model: 'deepseek-r1:8b',
            messages: [{ role: 'user', content: userPrompt }],
            stream: true
          });

          for await (const part of streamResponse) {
            responseText = responseText + part.message.content;
            panel.webview.postMessage({ command: 'deepseekChatResponse', text: responseText });
          }
        } catch (error) {
          panel.webview.postMessage({ command: 'deepseekChatResponse', text: `Error! Somethign went wrong: ${String(error)}` });
        }
      }
    });
  });

  context.subscriptions.push(disposable);
}

function getWebviewContent(): string {
  return /*html*/ `
                  <!DOCTYPE html>
                  <html lang="en">
                  <head>
                    <meta charset="UTF-8">
                    <style>
                      body{font-family: sans-serif; margin: 1rem;}
                      h2{font-size: 20px; text-align: center}
                      #prompt {width: 100%; height: 100px; box-sizing: border-box; border-radius: 10px; resize: vertical; padding: 5px}
                      #response {border: 1px solid #ccc; margin-top: 1rem; padding: 0.5rem; overflow-wrap: anywhere;}
                      #response:empty::before {content: 'Deepseek will answer here...'}
                    </style>
                  </head>
                  <body>
                    <h2> Deepseek Chat</h2>
                    <textarea id="prompt" rows="2" placeholder="Ask Something :)"></textarea><br/>
                    <button id="askButton">Ask</button>
                      <div id="response">
                      </div>
                      <script>
                        const vscode = acquireVsCodeApi();

                        document.getElementById('askButton').addEventListener('click', ()=>{
                          const text = document.getElementById('prompt').value;
                          vscode.postMessage({command: 'chat', text});
                        });

                        window.addEventListener('message', event =>{
                          const {command, text} = event.data;
                          if(command === 'deepseekChatResponse'){
                            document.getElementById('response').innerText = text;
                          }
                        });

                      </script>
                  </body>
                  </html>
                  `;
}

export function deactivate() {}
