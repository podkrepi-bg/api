# Email Template Service

It gets the templates based on the name and the templates in the src/assets/templates.

## Testing with adapter

Why do we need the `template.service.spec-adapter.ts` when we have the `template.service.ts`?
It's looking in a hardcoded path which is correct when the app is built and deployed but incorrect when running the tests. Hence we extend the base class with this for the tests.

## Visualize the template before you ship the code

- temporarily add a line like `writeFileSync('./rendered-template.html', rendered.html)` to your test (careful to not )
- then open that with the browser i.e. `file:///C:/Users/gparl/Downloads/projects/podkrepi-bg-api/rendered-template.html` or on ubuntu under wsl `file://wsl.localhost/Ubuntu/home/gparlakov/projects/podkrepi-bg-api/rendered-template.html`
- remember to delete that `writeFileSync` line and the `rendered-template.html` before you ship

```ts
const t = new CreateCampaignApplicationOrganizerEmailDto({
  firstName: 'test',
  email: 'test@email',
  campaignApplicationLink: 'link',
  campaignApplicationName: 'campaignApplicationName',
})

const rendered = await s.getTemplate(t)

writeFileSync('./rendered-template.html', rendered.html)
```
