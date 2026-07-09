Feature: Compatibility grows through choices
  As a player on the island
  I want my dialogue choices to affect compatibility with an islander
  So that my choices feel meaningful to the story

  Background:
    Given an islander named "Priya" with bio "Loves late-night bonfire chats"
    And a player named "Sam"

  Scenario: A positive choice increases compatibility
    Given an episode 1 choice "Compliment Priya's swimwear" with an islander named "Priya" worth 15 compatibility
    When "Sam" applies the choice "Compliment Priya's swimwear"
    Then "Sam"'s compatibility with "Priya" should be 15

  Scenario: Compatibility cannot exceed the maximum
    Given an episode 1 choice "Compliment Priya's swimwear" with an islander named "Priya" worth 15 compatibility
    And "Sam"'s compatibility with "Priya" is already 95
    When "Sam" applies the choice "Compliment Priya's swimwear"
    Then "Sam"'s compatibility with "Priya" should be 100
