-- Add a new campaign type for membership campaigns

INSERT INTO api.campaign_types (name, slug, description, parent_id, category)
VALUES ('Membership', 'membership', 'Membership Campaigns', null, 'others');

