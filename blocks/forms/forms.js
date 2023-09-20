import { createOptimizedPicture } from '../../scripts/lib-franklin.js';


export default function decorate(block) {

    function loadHubSpotFormScript() {
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = '//js.hsforms.net/forms/embed/v2.js';
    script.charset = 'utf-8';

    // Define a callback function to create the form after the script loads
    script.onload = function () {
        hbspt.forms.create({
        region: "na1",
        portalId: "1769030",
        formId: "828820d8-9902-4b4e-8ff4-169076195288",
        target: '#myFormContainer' // Specify the container where the form should be rendered
        });
    };

    // Append the script to the document's head
    document.head.appendChild(script);
    }

    // Call the function to load the HubSpot form script
    loadHubSpotFormScript();
    
    console.log(block);
    const element = document.createElement('div');
    element.id="myFormContainer";
    block.append(element);
}
