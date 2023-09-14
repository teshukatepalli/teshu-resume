import { createOptimizedPicture } from '../../scripts/lib-franklin.js';

export default function decorate(block) {
    console.log(block);
    const element = document.createElement('div');
    element.innerHTML = `
    <script charset="utf-8" type="text/javascript" src="//js.hsforms.net/forms/embed/v2.js"></script>
    <script>
    hbspt.forms.create({
        region: "na1",
        portalId: "1769030",
        formId: "828820d8-9902-4b4e-8ff4-169076195288"
    });
    </script>`;
    block.append(element);
    // const ul = document.createElement('ul');
    // [...block.children].forEach((row) => {
    //     const li = document.createElement('li');
    //     while (row.firstElementChild) li.append(row.firstElementChild);
    //     [...li.children].forEach((div) => {
    //     if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-card-image';
    //     else div.className = 'cards-card-body';
    //     });
    //     ul.append(li);
    // });
    // ul.querySelectorAll('img').forEach((img) => img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }])));
    // block.textContent = '';
    // block.append(ul);
}
