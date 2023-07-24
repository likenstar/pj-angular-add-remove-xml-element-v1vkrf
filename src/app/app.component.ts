import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';

export const DIC_XML_URL = 'assets/States.DIC.xml';

export interface IFileDictionary {
  file: string;
  data: string;
}

@Component({
  selector: 'my-app',
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {
  
  public xmlContent = '';

  private __textIndent = '  ';

  private __xml: XMLDocument = null;

  public constructor(private __http: HttpClient) {
  }

  public ngOnInit(): void {
    this.loadConfig();
  }
  
  public handle(error: HttpErrorResponse): Observable<never> {
    console.log(error);
    return throwError('HttpErrorService: an error occurred');
  }

  /**
   * Načte překladové slovníky
   */
  public async loadConfig(): Promise<IFileDictionary> {
    let value: IFileDictionary = null;
    try {
      value = await new Promise<IFileDictionary>((resolve, reject) => {
        this.__http.get(DIC_XML_URL, {responseType: 'text'}).pipe(
           catchError(this.handle)
        ).subscribe({
          next: (value: string) => {
            resolve({file: DIC_XML_URL, data: value});
          },
          error: (error: any) => {
            reject(error);
          }
        });
      });

      this.__xml = (new DOMParser()).parseFromString(value.data, 'text/xml');
      (window as any).xml = this.__xml;

      return value;
    } catch (reason) {
      return reason;
    }
  }

  public onAddClick(): void {
    const entry = this.__xml.querySelector('entry#Active');

    let lastWhitespace: string = null, butLastWhitespace: string = null;
    Array.from(entry.childNodes).forEach((node: Node) => {
      if (node instanceof Text) {
        butLastWhitespace = lastWhitespace;
        lastWhitespace = node.textContent;
      }
    });

    const test = this.__xml.createElement('translation');
    test.setAttribute('language', 'XX');
    test.textContent = 'Test';
    entry.appendChild(test);

    if (lastWhitespace && butLastWhitespace) {
      const nodes: Node[] = Array.from(entry.childNodes).filter((node: Node) => node instanceof Text).reverse();
      nodes[0].textContent = butLastWhitespace;
      entry.appendChild(this.__xml.createTextNode(lastWhitespace));
    }

    this.xmlContent = (new XMLSerializer()).serializeToString(this.__xml);
  }

  public onRemoveClick(): void {
    const
      entry = this.__xml.querySelector('entry#Active'),
      translation = entry.querySelector('[language="XX"]'),
      previousNode = translation.previousSibling
    ;
    if (translation) {
      previousNode && entry.removeChild(previousNode);
      entry.removeChild(translation);
    }

    this.xmlContent = (new XMLSerializer()).serializeToString(this.__xml);
  }

  public onSaveClick(): void {
    const
      xmlString = (new XMLSerializer()).serializeToString(this.__xml),
      dataURL = URL.createObjectURL(new Blob([xmlString], {type: 'text/xml'})),
      a = document.createElement('a'),
      body = document.body
    ;

    a.href = dataURL;
    a.download = 'States.DIC.xml';

    body.appendChild(a);
    a.click();
    body.removeChild(a);
  }

}
